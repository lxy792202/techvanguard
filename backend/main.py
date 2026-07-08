"""TechVanguard — FastAPI Application Entry Point."""

import asyncio
import json
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from config import settings
from database import init_db, get_db, get_items_collection
from models import Item
from schemas import ItemResponse, ItemListResponse, CollectRequest
from collector.arxiv import collect_arxiv
from collector.github import collect_github
from collector.hackernews import collect_hackernews
from collector.rss import collect_rss
from agents.summarizer import summarize_item
from agents.classifier import classify_item

# ── SSE event queue ──────────────────────────────────────────────────

_sse_queues: dict[str, asyncio.Queue] = {}


def _get_queue(session_id: str = "default") -> asyncio.Queue:
    if session_id not in _sse_queues:
        _sse_queues[session_id] = asyncio.Queue(maxsize=1000)
    return _sse_queues[session_id]


async def _broadcast(event: str, data: dict):
    """Push an event to all SSE listeners."""
    payload = {"event": event, "data": json.dumps(data, ensure_ascii=False)}
    dead = []
    for sid, q in _sse_queues.items():
        try:
            q.put_nowait(payload)
        except asyncio.QueueFull:
            dead.append(sid)
    for sid in dead:
        del _sse_queues[sid]


# ── Lifespan ─────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Start the background scheduler
    from scheduler import start_scheduler
    await start_scheduler()
    yield


# ── App ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="TechVanguard",
    description="前沿瞭望 — 多智能体驱动的前沿技术追踪平台",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── API Routes ───────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"name": "TechVanguard", "version": "1.0.0"}


@app.get("/api/items", response_model=ItemListResponse)
async def list_items(
    category: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    sort: str = Query("score"),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    query = select(Item)
    if category:
        query = query.where(Item.category == category)
    if source:
        query = query.where(Item.source == source)

    # Count
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    # Sort & paginate
    if sort == "score":
        query = query.order_by(desc(Item.score))
    elif sort == "trend":
        query = query.order_by(desc(Item.trend_score))
    else:
        query = query.order_by(desc(Item.collected_at))

    query = query.offset(offset).limit(limit)
    rows = (await db.execute(query)).scalars().all()
    return ItemListResponse(
        items=[ItemResponse.model_validate(r) for r in rows],
        total=total,
    )


@app.get("/api/items/{item_id}", response_model=ItemResponse)
async def get_item(item_id: int, db: AsyncSession = Depends(get_db)):
    item = (await db.execute(select(Item).where(Item.id == item_id))).scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return ItemResponse.model_validate(item)


@app.post("/api/collect")
async def trigger_collect(req: CollectRequest):
    """Manually trigger data collection."""
    sources = req.sources or settings.enabled_sources
    asyncio.create_task(_run_collection(sources))
    return {"status": "started", "sources": sources}


@app.get("/api/sse/{session_id}")
async def sse_stream(session_id: str):
    """SSE endpoint for real-time agent progress."""
    queue = _get_queue(session_id)

    async def event_generator():
        while True:
            payload = await queue.get()
            yield payload

    return EventSourceResponse(event_generator())


@app.get("/api/trends")
async def get_trends(db: AsyncSession = Depends(get_db)):
    """Get trend data: hot keywords and timeline."""
    # Collect recent items and extract tag frequencies
    thirty_days_ago = None  # We'll get all items for now
    query = select(Item).order_by(desc(Item.collected_at)).limit(500)
    rows = (await db.execute(query)).scalars().all()

    from collections import Counter
    tag_counter: Counter = Counter()
    for r in rows:
        try:
            tags = json.loads(r.tags) if isinstance(r.tags, str) else r.tags
            if isinstance(tags, list):
                for t in tags:
                    tag_counter[t.lower()] += 1
        except (json.JSONDecodeError, TypeError):
            pass

    keywords = [
        {"word": word, "count": count, "trend": "up" if count > 3 else "stable"}
        for word, count in tag_counter.most_common(20)
    ]

    # Count by category over time (by day for last 7 days)
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    timeline = []
    for i in range(7):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        for cat in ["paper", "tech", "tool", "opinion"]:
            cq = select(func.count()).where(
                Item.category == cat,
                Item.collected_at >= day_start,
                Item.collected_at < day_end,
            )
            cnt = (await db.execute(cq)).scalar() or 0
            if cnt > 0:
                timeline.append({
                    "date": day_start.strftime("%Y-%m-%d"),
                    "category": cat,
                    "count": cnt,
                })

    return {"keywords": keywords, "timeline": timeline}


@app.get("/api/search")
async def search_items(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Semantic search via ChromaDB, fallback to SQL LIKE."""
    try:
        collection = get_items_collection()
        results = collection.query(
            query_texts=[q],
            n_results=limit,
        )
        if results["ids"] and results["ids"][0]:
            source_ids = results["ids"][0]
            items = []
            for sid in source_ids:
                row = (await db.execute(
                    select(Item).where(Item.source_id == sid)
                )).scalar_one_or_none()
                if row:
                    items.append(ItemResponse.model_validate(row))
            return ItemListResponse(items=items, total=len(items))
    except Exception:
        pass

    # Fallback: SQL LIKE
    query = select(Item).where(
        Item.title.ilike(f"%{q}%") | Item.summary_zh.ilike(f"%{q}%")
    ).order_by(desc(Item.score)).limit(limit)
    rows = (await db.execute(query)).scalars().all()
    return ItemListResponse(
        items=[ItemResponse.model_validate(r) for r in rows],
        total=len(rows),
    )


@app.get("/api/digest")
async def get_digest():
    """Get AI-generated daily tech digest."""
    from agents.digest import generate_digest
    digest = await generate_digest()
    return digest


# ── Background collection pipeline ───────────────────────────────────

async def _run_collection(sources: list[str]):
    """Run the full collection pipeline for requested sources."""
    all_items = []

    for source in sources:
        await _broadcast("progress", {
            "source": source,
            "status": "collecting",
            "message": f"开始采集 {source}...",
            "item_count": 0,
        })
        try:
            if source == "arxiv":
                items = await collect_arxiv()
            elif source == "github":
                items = await collect_github()
            elif source == "hackernews":
                items = await collect_hackernews()
            elif source == "rss":
                items = await collect_rss()
            else:
                items = []
        except Exception as e:
            await _broadcast("progress", {
                "source": source,
                "status": "error",
                "message": f"采集 {source} 失败: {str(e)}",
                "item_count": 0,
            })
            continue

        await _broadcast("progress", {
            "source": source,
            "status": "summarizing",
            "message": f"采集完成，获得 {len(items)} 条数据，开始 AI 摘要...",
            "item_count": len(items),
        })

        # AI processing: summarize + classify
        processed = []
        for raw in items:
            try:
                summarized = await summarize_item(raw)
                classified = await classify_item(summarized)
                processed.append(classified)
            except Exception as e:
                raw["summary_zh"] = raw.get("raw_text", "")[:200]
                raw["category"] = "tech"
                raw["tags"] = json.dumps([raw.get("source", "unknown")], ensure_ascii=False)
                processed.append(raw)

        await _broadcast("progress", {
            "source": source,
            "status": "saving",
            "message": f"AI 处理完成，正在保存 {len(processed)} 条数据...",
            "item_count": len(processed),
        })

        # Save to database + ChromaDB
        await _save_items(processed)
        all_items.extend(processed)

        await _broadcast("progress", {
            "source": source,
            "status": "done",
            "message": f"{source} 采集完成，共保存 {len(processed)} 条",
            "item_count": len(processed),
        })

    await _broadcast("complete", {
        "source": "all",
        "status": "done",
        "message": f"全部采集完成，共 {len(all_items)} 条新内容",
        "item_count": len(all_items),
    })


async def _save_items(items: list[dict]):
    """Deduplicate and save items to SQLite + ChromaDB."""
    from sqlalchemy import select as sa_select
    from database import async_session_factory, get_items_collection

    collection = get_items_collection()
    chroma_ids = []
    chroma_texts = []
    chroma_metadatas = []
    new_items = []

    async with async_session_factory() as session:
        for item in items:
            # Check duplicate by source + source_id
            existing = (await session.execute(
                sa_select(Item).where(
                    Item.source == item["source"],
                    Item.source_id == item["source_id"],
                )
            )).scalar_one_or_none()
            if existing:
                continue

            # Save to SQLite
            db_item = Item(
                source=item["source"],
                source_id=item["source_id"],
                title=item["title"],
                url=item["url"],
                summary_zh=item.get("summary_zh", ""),
                raw_text=item.get("raw_text", ""),
                category=item.get("category", ""),
                tags=item.get("tags", "[]"),
                score=item.get("score", 0.0),
                published_at=item.get("published_at"),
            )
            session.add(db_item)
            await session.flush()

            # Prepare for Chroma
            chroma_ids.append(item["source_id"])
            chroma_texts.append(f"{item['title']}\n{item.get('summary_zh', '')}")
            chroma_metadatas.append({
                "source": item["source"],
                "category": item.get("category", ""),
                "score": str(item.get("score", 0)),
            })
            new_items.append(item)

        await session.commit()

    # Batch add to ChromaDB
    if chroma_ids:
        try:
            collection.add(
                ids=chroma_ids,
                documents=chroma_texts,
                metadatas=chroma_metadatas,
            )
        except Exception:
            pass  # Chroma errors are non-fatal

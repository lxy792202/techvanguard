"""Daily digest generator — uses DeepSeek to write a summary article."""

import json
from datetime import datetime, timedelta
from openai import AsyncOpenAI
from sqlalchemy import select, desc
from config import settings
from database import async_session_factory
from models import Item

_client: AsyncOpenAI | None = None

def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.deepseek_api_key, base_url=settings.deepseek_base_url)
    return _client


async def generate_digest() -> dict:
    """Generate a daily tech digest from recent items."""
    async with async_session_factory() as session:
        day_ago = datetime.utcnow() - timedelta(hours=24)
        query = select(Item).where(Item.collected_at >= day_ago).order_by(desc(Item.score)).limit(30)
        rows = (await session.execute(query)).scalars().all()

    if not rows:
        # Fallback: get latest 20 items
        async with async_session_factory() as session:
            query = select(Item).order_by(desc(Item.collected_at)).limit(20)
            rows = (await session.execute(query)).scalars().all()

    if not rows:
        return {"title": "暂无数据", "sections": [], "summary": "请先采集数据"}

    # Prepare source data for LLM
    sources = []
    for r in rows:
        tags_list = []
        try: tags_list = json.loads(r.tags) if isinstance(r.tags, str) else []
        except: pass
        sources.append({
            "id": r.id,
            "title": r.title,
            "source": r.source,
            "url": r.url,
            "category": r.category,
            "tags": tags_list[:3],
            "score": r.score,
        })

    if settings.deepseek_api_key:
        try:
            client = _get_client()
            prompt = f"""你是一个前沿技术编辑。请根据以下今日采集的技术资讯，撰写一篇中文日报摘要。

要求：
1. 标题：吸引人、概括今日重点
2. 写 3-5 个主题段落，每个段落围绕一个技术话题展开
3. 每个段落末尾用 [来源:N] 标注引用了哪条资讯（N 是 id 编号）
4. 语言简洁专业，面向 AI 从业者
5. 最后写一段总结

资讯列表（标题, 分类, 标签, 热度）：
{json.dumps(sources, ensure_ascii=False, indent=2)}

请以 JSON 格式返回：
{{
  "title": "日报标题",
  "sections": [
    {{"topic": "话题名", "content": "段落内容，末尾标注 [来源:id]", "source_ids": [id列表]}},
    ...
  ],
  "summary": "一句话总结"
}}"""

            resp = await client.chat.completions.create(
                model=settings.llm_model,
                messages=[
                    {"role": "system", "content": "你是一个专业的技术内容编辑，擅长将多篇资讯整合为精彩的日报。"},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.4,
                max_tokens=2000,
            )

            content = resp.choices[0].message.content or ""
            content = content.strip()
            if content.startswith("```"):
                content = content.split("\n", 1)[-1]
                if "```" in content:
                    content = content.rsplit("```", 1)[0]
            content = content.strip()

            result = json.loads(content)
            result["items"] = [r.to_dict() for r in rows]
            return result
        except Exception as e:
            pass

    # Fallback: simple digest
    return {
        "title": f"今日前沿技术摘要 ({len(rows)} 条)",
        "sections": [
            {
                "topic": "技术动态",
                "content": "今日共采集 " + str(len(rows)) + " 条前沿技术资讯。" +
                    " 最高热度: " + (rows[0].title if rows else "无"),
                "source_ids": [r.id for r in rows[:3]],
            }
        ],
        "summary": f"共 {len(rows)} 条资讯",
        "items": [r.to_dict() for r in rows],
    }

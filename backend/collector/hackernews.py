"""Hacker News top stories collector."""

import httpx
from datetime import datetime, timezone

HN_BASE = "https://hacker-news.firebaseio.com/v0"


async def collect_hackernews(top_n: int = 20) -> list[dict]:
    """
    Fetch top stories from Hacker News.
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Get top story IDs
        resp = await client.get(f"{HN_BASE}/topstories.json")
        resp.raise_for_status()
        story_ids = resp.json()[:top_n]

        # Fetch each story
        items = []
        for sid in story_ids:
            try:
                s_resp = await client.get(f"{HN_BASE}/item/{sid}.json")
                if s_resp.status_code != 200:
                    continue
                story = s_resp.json()
                if not story or story.get("type") != "story":
                    continue

                title = story.get("title", "")
                url = story.get("url", f"https://news.ycombinator.com/item?id={sid}")
                score_val = story.get("score", 0)
                text = story.get("text", "")
                by = story.get("by", "unknown")

                ts = story.get("time", 0)
                published = datetime.fromtimestamp(ts, tz=timezone.utc) if ts else None

                # Categorize based on title keywords
                category = _guess_category(title)

                items.append({
                    "source": "hackernews",
                    "source_id": f"hn_{sid}",
                    "title": title,
                    "url": url,
                    "raw_text": f"By: {by}\nPoints: {score_val}\n\n{text or title}",
                    "summary_zh": "",
                    "category": category,
                    "tags": f'["hackernews", {json.dumps(category, ensure_ascii=False)}]',
                    "score": float(score_val),
                    "published_at": published,
                })
            except Exception:
                continue

    return items


def _guess_category(title: str) -> str:
    lower = title.lower()
    if any(w in lower for w in ["paper", "research", "survey", "arxiv", "benchmark", "dataset"]):
        return "paper"
    if any(w in lower for w in ["show hn", "release", "launch", "open source", "github"]):
        return "tool"
    if any(w in lower for w in ["how to", "guide", "tutorial", "my approach", "lesson"]):
        return "opinion"
    return "tech"


import json  # noqa: E402 (used in the f-string above)

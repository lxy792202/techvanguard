"""RSS feed collector."""

import httpx
import feedparser
from datetime import datetime, timezone

from config import settings


async def collect_rss() -> list[dict]:
    """
    Fetch items from configured RSS feeds.
    """
    feeds = settings.rss_feeds
    if not feeds:
        return []

    items = []
    async with httpx.AsyncClient(timeout=30.0) as client:
        for feed_url in feeds:
            try:
                resp = await client.get(feed_url)
                resp.raise_for_status()
                feed = feedparser.parse(resp.text)

                for entry in feed.entries[:10]:  # top 10 per feed
                    title = entry.get("title", "").strip()
                    link = entry.get("link", "")
                    summary = entry.get("summary", entry.get("description", "")).strip()

                    published = None
                    if "published_parsed" in entry and entry.published_parsed:
                        published = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
                    elif "updated_parsed" in entry and entry.updated_parsed:
                        published = datetime(*entry.updated_parsed[:6], tzinfo=timezone.utc)

                    # Generate a stable source_id
                    import hashlib
                    source_id = f"rss_{hashlib.md5((feed_url + title).encode()).hexdigest()[:12]}"

                    category = _guess_category(title, summary)

                    items.append({
                        "source": "rss",
                        "source_id": source_id,
                        "title": title,
                        "url": link,
                        "raw_text": summary,
                        "summary_zh": "",
                        "category": category,
                        "tags": f'["rss", {json.dumps(category, ensure_ascii=False)}]',
                        "score": 30.0,
                        "published_at": published,
                    })
            except Exception:
                continue

    return items


def _guess_category(title: str, summary: str) -> str:
    text = (title + " " + summary).lower()
    if any(w in text for w in ["paper", "research", "survey", "arxiv", "benchmark", "dataset", "study"]):
        return "paper"
    if any(w in text for w in ["release", "launch", "open source", "github", "tool", "library", "framework"]):
        return "tool"
    if any(w in text for w in ["how to", "guide", "tutorial", "my approach", "opinion", "why i", "lesson"]):
        return "opinion"
    return "tech"


import json  # noqa: E402

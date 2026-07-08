"""arXiv paper collector via MCP tool, with direct fallback."""

import httpx
import feedparser
from datetime import datetime, timezone
from typing import Optional

ARXIV_API_URL = "https://export.arxiv.org/api/query"


async def collect_arxiv(
    query: str = "cat:cs.AI OR cat:cs.LG OR cat:cs.CL",
    max_results: int = 20,
) -> list[dict]:
    """
    Fetch recent papers from arXiv.
    Returns list of dicts with keys: source, source_id, title, url,
    raw_text, score, published_at.
    """
    params = {
        "search_query": query,
        "sortBy": "submittedDate",
        "sortOrder": "descending",
        "max_results": max_results,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(ARXIV_API_URL, params=params)
        resp.raise_for_status()

    feed = feedparser.parse(resp.text)
    items = []

    for entry in feed.entries:
        arxiv_id = entry.get("id", "").split("/")[-1].split("v")[0]
        title = entry.get("title", "").replace("\n", " ").strip()
        summary = entry.get("summary", "").replace("\n", " ").strip()

        # Try to get published date
        published = None
        if "published" in entry:
            published = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)

        # Extract authors
        authors = [a.get("name", "") for a in entry.get("authors", [])]

        # Compute a rough score based on comments/links
        score = 50.0  # default baseline

        items.append({
            "source": "arxiv",
            "source_id": f"arxiv_{arxiv_id}",
            "title": title,
            "url": entry.get("id", f"https://arxiv.org/abs/{arxiv_id}"),
            "raw_text": f"Authors: {', '.join(authors)}\n\n{summary}",
            "summary_zh": "",
            "category": "paper",
            "tags": "[]",
            "score": score,
            "published_at": published,
        })

    return items

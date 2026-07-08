"""MCP Tool definitions — each source wrapped as an MCP-compatible tool.

These are registered with the MCP Server and can also be called directly
by the collector agents.
"""

from typing import Any
from datetime import datetime, timezone, timedelta
import httpx
import feedparser

# ── Tool schemas (for MCP registration) ──────────────────────────────

ARXIV_TOOL = {
    "name": "search_arxiv",
    "description": "Search arXiv for recent AI/ML papers",
    "inputSchema": {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "arXiv search query"},
            "max_results": {"type": "integer", "description": "Max results"},
        },
    },
}

GITHUB_TOOL = {
    "name": "get_github_trending",
    "description": "Get trending GitHub repositories",
    "inputSchema": {
        "type": "object",
        "properties": {
            "language": {"type": "string", "description": "Filter by language"},
            "since": {"type": "string", "description": "daily/weekly/monthly"},
        },
    },
}

HN_TOOL = {
    "name": "get_hackernews_top",
    "description": "Get top stories from Hacker News",
    "inputSchema": {
        "type": "object",
        "properties": {
            "count": {"type": "integer", "description": "Number of stories"},
        },
    },
}

RSS_TOOL = {
    "name": "fetch_rss",
    "description": "Fetch entries from an RSS feed",
    "inputSchema": {
        "type": "object",
        "properties": {
            "url": {"type": "string", "description": "RSS feed URL"},
            "max_items": {"type": "integer", "description": "Max items"},
        },
    },
}

ALL_TOOLS = [ARXIV_TOOL, GITHUB_TOOL, HN_TOOL, RSS_TOOL]


# ── Tool implementations ─────────────────────────────────────────────

async def search_arxiv(query: str = "cat:cs.AI OR cat:cs.LG OR cat:cs.CL", max_results: int = 15) -> list[dict]:
    """Search arXiv papers via OAI-PMH API."""
    params = {
        "search_query": query,
        "sortBy": "submittedDate",
        "sortOrder": "descending",
        "max_results": min(max_results, 50),
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get("https://export.arxiv.org/api/query", params=params)
        resp.raise_for_status()

    feed = feedparser.parse(resp.text)
    items = []
    for entry in feed.entries:
        arxiv_id = entry.get("id", "").split("/")[-1].split("v")[0]
        authors = [a.get("name", "") for a in entry.get("authors", [])]
        items.append({
            "id": arxiv_id,
            "title": entry.get("title", "").replace("\n", " ").strip(),
            "url": entry.get("id", f"https://arxiv.org/abs/{arxiv_id}"),
            "authors": authors,
            "summary": entry.get("summary", "").replace("\n", " ").strip()[:500],
        })
    return items


async def get_github_trending(language: str = "", since: str = "daily") -> list[dict]:
    """Get trending repos via GitHub search API."""
    date_cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")
    qualifiers = [f"pushed:>{date_cutoff}", "stars:>100"]
    if language:
        qualifiers.append(f"language:{language}")

    params = {"q": "+".join(qualifiers), "sort": "stars", "order": "desc", "per_page": 10}
    headers = {"Accept": "application/vnd.github.v3+json", "User-Agent": "TechVanguard-MCP/1.0"}

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get("https://api.github.com/search/repositories", params=params, headers=headers)
        if resp.status_code != 200:
            return []
        data = resp.json()

    return [
        {
            "name": r.get("full_name", ""),
            "url": r.get("html_url", ""),
            "description": r.get("description") or "",
            "stars": r.get("stargazers_count", 0),
            "language": r.get("language") or "",
            "topics": r.get("topics", []),
        }
        for r in data.get("items", [])
    ]


async def get_hackernews_top(count: int = 15) -> list[dict]:
    """Get top stories from Hacker News Firebase API."""
    HN_BASE = "https://hacker-news.firebaseio.com/v0"
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(f"{HN_BASE}/topstories.json")
        resp.raise_for_status()
        story_ids = resp.json()[:count]

        items = []
        for sid in story_ids:
            try:
                s_resp = await client.get(f"{HN_BASE}/item/{sid}.json")
                if s_resp.status_code != 200:
                    continue
                s = s_resp.json()
                if s and s.get("type") == "story":
                    items.append({
                        "id": sid,
                        "title": s.get("title", ""),
                        "url": s.get("url", f"https://news.ycombinator.com/item?id={sid}"),
                        "score": s.get("score", 0),
                        "by": s.get("by", ""),
                    })
            except Exception:
                continue
    return items


async def fetch_rss(url: str, max_items: int = 10) -> list[dict]:
    """Fetch and parse an RSS feed."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()

    feed = feedparser.parse(resp.text)
    return [
        {
            "title": e.get("title", "").strip(),
            "link": e.get("link", ""),
            "summary": e.get("summary", e.get("description", "")).strip()[:500],
            "published": e.get("published", ""),
        }
        for e in feed.entries[:max_items]
    ]


# ── Dispatcher ───────────────────────────────────────────────────────

async def execute_tool(name: str, arguments: dict) -> Any:
    """Dispatch a tool call by name."""
    dispatcher = {
        "search_arxiv": search_arxiv,
        "get_github_trending": get_github_trending,
        "get_hackernews_top": get_hackernews_top,
        "fetch_rss": fetch_rss,
    }
    fn = dispatcher.get(name)
    if not fn:
        raise ValueError(f"Unknown tool: {name}")
    return await fn(**arguments)

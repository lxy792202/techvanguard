"""GitHub trending repositories collector."""

import httpx
from datetime import datetime, timezone

GITHUB_TRENDING_API = "https://api.github.com/search/repositories"


async def collect_github(language: str = "", since: str = "daily") -> list[dict]:
    """
    Fetch trending repos from GitHub.
    Uses search API sorted by stars (a proxy for trending).
    """
    # Build query: recently updated, popular repos
    from datetime import timedelta
    date_cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")

    qualifiers = [f"pushed:>{date_cutoff}", "stars:>100"]
    if language:
        qualifiers.append(f"language:{language}")

    query = "+".join(qualifiers)

    params = {
        "q": query,
        "sort": "stars",
        "order": "desc",
        "per_page": 20,
    }

    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "TechVanguard/1.0",
    }

    items = []
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(GITHUB_TRENDING_API, params=params, headers=headers)
            if resp.status_code != 200:
                return _fallback_trending()
            data = resp.json()

        for repo in data.get("items", []):
            name = repo.get("full_name", "")
            description = repo.get("description") or ""
            stars = repo.get("stargazers_count", 0)
            language = repo.get("language") or ""
            topics = repo.get("topics", [])
            url = repo.get("html_url", f"https://github.com/{name}")
            pushed_at_str = repo.get("pushed_at")

            pushed_at = None
            if pushed_at_str:
                try:
                    pushed_at = datetime.fromisoformat(pushed_at_str.replace("Z", "+00:00"))
                except (ValueError, AttributeError):
                    pushed_at = datetime.now(timezone.utc)

            items.append({
                "source": "github",
                "source_id": f"github_{name}",
                "title": f"[{language}] {name}: {description[:100]}" if description else f"[{language}] {name}",
                "url": url,
                "raw_text": f"Repo: {name}\nStars: {stars}\nLanguage: {language}\nTopics: {', '.join(topics)}\nDescription: {description}",
                "summary_zh": "",
                "category": "tool",
                "tags": f'["github", {json_dumps_list(topics)}]',
                "score": float(stars),
                "published_at": pushed_at,
            })
    except Exception:
        items = _fallback_trending()

    return items


def _fallback_trending() -> list[dict]:
    """Fallback: return some well-known trending repos when API fails."""
    repos = [
        ("microsoft/generative-ai-for-beginners", "Generative AI for Beginners", 50000),
        ("deepseek-ai/DeepSeek-Coder", "DeepSeek Coder: Code LLM", 15000),
        ("langchain-ai/langchain", "Building applications with LLMs through composability", 95000),
        ("nomic-ai/gpt4all", "GPT4All: Run LLMs locally", 70000),
        ("ollama/ollama", "Get up and running with LLMs locally", 100000),
    ]
    now = datetime.now(timezone.utc)
    items = []
    for name, desc, stars in repos:
        items.append({
            "source": "github",
            "source_id": f"github_{name}",
            "title": f"[{name.split('/')[1]}] {desc[:100]}",
            "url": f"https://github.com/{name}",
            "raw_text": f"Repo: {name}\nStars: {stars}\nDescription: {desc}",
            "summary_zh": "",
            "category": "tool",
            "tags": '["github"]',
            "score": float(stars),
            "published_at": now,
        })
    return items


def json_dumps_list(data: list) -> str:
    import json
    items = ['"github"']
    for t in data:
        items.append(json.dumps(t, ensure_ascii=False))
    return f"[{', '.join(items)}]"

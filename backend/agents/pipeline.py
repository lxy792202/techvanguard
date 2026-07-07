"""Agent Pipeline — orchestrates collection → AI processing → saving."""

from typing import Optional
from collector import (
    collect_arxiv,
    collect_github,
    collect_hackernews,
    collect_rss,
)
from agents.summarizer import summarize_item
from agents.classifier import classify_item


async def run_pipeline(sources: Optional[list[str]] = None):
    """
    Run the full pipeline for given sources (or all).
    Returns processed items ready for storage.
    This is used by the scheduler and manual triggers.
    """
    from config import settings

    sources = sources or settings.enabled_sources
    all_items = []

    for source in sources:
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
                continue
        except Exception as e:
            continue

        # Process each item
        for item in items:
            try:
                item = await summarize_item(item)
                item = await classify_item(item)
            except Exception:
                pass

        all_items.extend(items)

    return all_items

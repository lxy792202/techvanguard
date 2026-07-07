"""Collector __init__ — easier imports."""

from .arxiv import collect_arxiv
from .github import collect_github
from .hackernews import collect_hackernews
from .rss import collect_rss

__all__ = ["collect_arxiv", "collect_github", "collect_hackernews", "collect_rss"]

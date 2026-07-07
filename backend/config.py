"""TechVanguard configuration — loaded from environment / .env file."""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # DeepSeek / LLM
    deepseek_api_key: str = os.getenv("DEEPSEEK_API_KEY", "")
    deepseek_base_url: str = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    llm_model: str = os.getenv("LLM_MODEL", "deepseek-chat")

    # Database
    database_url: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./techvanguard.db")
    chroma_db_path: str = os.getenv("CHROMA_DB_PATH", "./chroma_db")

    # Data source toggles
    source_arxiv: bool = os.getenv("SOURCE_ARXIV", "1") == "1"
    source_github: bool = os.getenv("SOURCE_GITHUB", "1") == "1"
    source_hackernews: bool = os.getenv("SOURCE_HACKERNEWS", "1") == "1"
    source_rss: bool = os.getenv("SOURCE_RSS", "1") == "1"
    source_zhihu: bool = os.getenv("SOURCE_ZHIHU", "0") == "1"

    # RSS feeds
    rss_feeds: list[str] = [
        f.strip() for f in os.getenv("RSS_FEEDS", "").split(",") if f.strip()
    ]

    # Schedule
    collect_interval_minutes: int = int(os.getenv("COLLECT_INTERVAL_MINUTES", "30"))

    # Server
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))

    # Enabled sources list (computed)
    @property
    def enabled_sources(self) -> list[str]:
        sources = []
        if self.source_arxiv:
            sources.append("arxiv")
        if self.source_github:
            sources.append("github")
        if self.source_hackernews:
            sources.append("hackernews")
        if self.source_rss:
            sources.append("rss")
        if self.source_zhihu:
            sources.append("zhihu")
        return sources


settings = Settings()

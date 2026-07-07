"""Database setup: SQLAlchemy + ChromaDB."""

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
import chromadb
from chromadb.config import Settings as ChromaSettings

from config import settings

# ── SQLAlchemy (SQLite) ──────────────────────────────────────────────

engine = create_async_engine(settings.database_url, echo=False)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session_factory() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        from models import Item  # noqa: ensure models registered
        await conn.run_sync(Base.metadata.create_all)


# ── ChromaDB (vector storage for dedup + similarity) ────────────────

_chroma_client: chromadb.ClientAPI | None = None


def get_chroma_client() -> chromadb.ClientAPI:
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(
            path=settings.chroma_db_path,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
    return _chroma_client


def get_items_collection() -> chromadb.Collection:
    client = get_chroma_client()
    return client.get_or_create_collection(
        name="tech_items",
        metadata={"hnsw:space": "cosine"},
    )

"""Pydantic schemas for API request/response."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ItemResponse(BaseModel):
    id: int
    source: str
    source_id: str
    title: str
    url: str
    summary_zh: str
    category: str
    tags: str
    score: float
    trend_score: float
    published_at: Optional[str] = None
    collected_at: Optional[str] = None

    class Config:
        from_attributes = True


class ItemListResponse(BaseModel):
    items: list[ItemResponse]
    total: int


class CollectRequest(BaseModel):
    sources: Optional[list[str]] = None  # None = all enabled sources


class CollectProgress(BaseModel):
    source: str
    status: str  # collecting / summarizing / classifying / done / error
    message: str
    item_count: int = 0


class TrendData(BaseModel):
    keywords: list[dict]  # [{word, count, trend}]
    timeline: list[dict]  # [{date, category, count}]

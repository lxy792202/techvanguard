"""Pydantic schemas for API request/response."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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
    published_at: Optional[datetime] = None
    collected_at: Optional[datetime] = None


class ItemListResponse(BaseModel):
    items: list[ItemResponse]
    total: int


class CollectRequest(BaseModel):
    sources: Optional[list[str]] = None


class CollectProgress(BaseModel):
    source: str
    status: str
    message: str
    item_count: int = 0


class TrendData(BaseModel):
    keywords: list[dict]
    timeline: list[dict]

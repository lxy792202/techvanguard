"""SQLAlchemy ORM models."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from database import Base


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String(50), nullable=False, index=True)  # arxiv / github / hn / rss / zhihu
    source_id = Column(String(255), nullable=False)  # unique ID from source
    title = Column(String(500), nullable=False)
    url = Column(String(1000), nullable=False)
    summary_zh = Column(Text, default="")  # AI-generated Chinese summary
    raw_text = Column(Text, default="")
    category = Column(String(50), index=True, default="")  # paper / tech / tool / opinion
    tags = Column(String(500), default="[]")  # JSON array of tag strings
    score = Column(Float, default=0.0)  # popularity score
    published_at = Column(DateTime, nullable=True)
    collected_at = Column(DateTime, default=datetime.utcnow)
    trend_score = Column(Float, default=0.0)

    def to_dict(self):
        return {
            "id": self.id,
            "source": self.source,
            "source_id": self.source_id,
            "title": self.title,
            "url": self.url,
            "summary_zh": self.summary_zh,
            "category": self.category,
            "tags": self.tags,
            "score": self.score,
            "trend_score": self.trend_score,
            "published_at": self.published_at.isoformat() if self.published_at else None,
            "collected_at": self.collected_at.isoformat() if self.collected_at else None,
        }

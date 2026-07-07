"""Trend Analyzer Agent — weekly trend analysis using DeepSeek."""

import json
from datetime import datetime, timedelta
from openai import AsyncOpenAI
from sqlalchemy import select
from config import settings
from database import async_session_factory
from models import Item

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.deepseek_api_key,
            base_url=settings.deepseek_base_url,
        )
    return _client


async def analyze_trends() -> dict:
    """
    Analyze recent items to identify trending topics and keywords.
    Returns structured trend data.
    """
    async with async_session_factory() as session:
        # Get items from last 7 days
        week_ago = datetime.utcnow() - timedelta(days=7)
        query = select(Item).where(Item.collected_at >= week_ago).order_by(Item.score.desc()).limit(100)
        rows = (await session.execute(query)).scalars().all()

    if not rows:
        return {"keywords": [], "summary": "暂无数据"}

    # Prepare data for LLM analysis
    titles = [r.title for r in rows]
    tags_list = []
    for r in rows:
        try:
            tags = json.loads(r.tags) if isinstance(r.tags, str) else []
            tags_list.extend(tags)
        except (json.JSONDecodeError, TypeError):
            pass

    # Use LLM for trend analysis if available
    if settings.deepseek_api_key:
        try:
            client = _get_client()
            prompt = f"""分析以下过去一周的技术前沿资讯标题和标签，输出：
1. 当前最热的3-5个技术话题
2. 每个话题的趋势方向（上升/平稳/下降）
3. 一句总结（50字以内）

标题列表：{json.dumps(titles[:50], ensure_ascii=False)}
高频标签：{json.dumps(tags_list[:30], ensure_ascii=False)}

以JSON格式返回：
{{
  "keywords": [{{"word": "话题名", "count": 出现次数, "trend": "up|stable|down"}}],
  "summary": "一句总结"
}}"""

            resp = await client.chat.completions.create(
                model=settings.llm_model,
                messages=[
                    {"role": "system", "content": "你是一个技术趋势分析师。"},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=500,
            )

            content = resp.choices[0].message.content or ""
            content = content.strip()
            if content.startswith("```"):
                content = content.split("\n", 1)[-1]
                if "```" in content:
                    content = content.rsplit("```", 1)[0]
            content = content.strip()

            return json.loads(content)
        except Exception:
            pass

    # Fallback: simple tag frequency
    from collections import Counter
    tag_counter = Counter(tags_list)
    keywords = [
        {"word": word, "count": count, "trend": "up" if count > 3 else "stable"}
        for word, count in tag_counter.most_common(10)
    ]
    return {"keywords": keywords, "summary": f"过去一周采集了 {len(rows)} 条前沿资讯，覆盖 {len(keywords)} 个热点话题"}

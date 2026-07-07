"""Summarizer Agent — uses DeepSeek LLM to generate Chinese summaries."""

from openai import AsyncOpenAI
from config import settings

# Initialize DeepSeek client (OpenAI-compatible)
_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.deepseek_api_key,
            base_url=settings.deepseek_base_url,
        )
    return _client


async def summarize_item(item: dict) -> dict:
    """
    Generate a Chinese summary of the item using DeepSeek.
    Also extract key insights and maintain the raw metadata.
    """
    if not settings.deepseek_api_key:
        # No API key configured: use raw text truncated
        item["summary_zh"] = item.get("raw_text", "")[:300]
        return item

    try:
        client = _get_client()

        prompt = f"""你是一个技术前沿追踪助手。请用中文为以下技术内容写一段摘要（200字以内），包括：
1. 核心内容是什么
2. 为什么值得关注

原文标题：{item.get('title', '')}
原文内容：{item.get('raw_text', '')[:2000]}

请直接输出摘要，不要有开头结尾的客套话。"""

        resp = await client.chat.completions.create(
            model=settings.llm_model,
            messages=[
                {"role": "system", "content": "你是一个专业的技术内容摘要助手，擅长用简洁的中文总结前沿技术资讯。"},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=500,
        )

        summary = resp.choices[0].message.content or ""
        item["summary_zh"] = summary.strip()

    except Exception as e:
        # Fallback: truncate raw text
        item["summary_zh"] = item.get("raw_text", "")[:300]

    return item

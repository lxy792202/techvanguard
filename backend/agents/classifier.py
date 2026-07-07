"""Classifier Agent — uses DeepSeek to categorize and tag items."""

import json
from openai import AsyncOpenAI
from config import settings

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.deepseek_api_key,
            base_url=settings.deepseek_base_url,
        )
    return _client


async def classify_item(item: dict) -> dict:
    """
    Classify item into category + extract tags using DeepSeek.
    Categories: paper / tech / tool / opinion
    """
    if not settings.deepseek_api_key:
        item["category"] = item.get("category", "tech")
        item["tags"] = '["' + item.get("source", "unknown") + '"]'
        return item

    try:
        client = _get_client()

        prompt = f"""请对以下技术内容进行分类和标签提取。

标题：{item.get('title', '')}
内容摘要：{item.get('raw_text', '')[:1500]}

请以JSON格式返回：
{{
  "category": "paper|tech|tool|opinion",
  "tags": ["标签1", "标签2", ...]
}}

分类说明：
- paper: 学术论文、研究报告
- tech: 技术文章、技术讨论、技术博客
- tool: 开源项目、工具发布、产品发布
- opinion: 观点、教程、经验分享

标签：提取2-5个技术关键词，如 "大语言模型"、"RAG"、"MCP"等

只返回JSON，不要其他文字。"""

        resp = await client.chat.completions.create(
            model=settings.llm_model,
            messages=[
                {"role": "system", "content": "你是一个技术内容分类助手。请精确分类并提取关键词标签。"},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            max_tokens=300,
        )

        content = resp.choices[0].message.content or ""
        # Parse JSON from response
        content = content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[-1]
            if "```" in content:
                content = content.rsplit("```", 1)[0]
        content = content.strip()

        result = json.loads(content)
        item["category"] = result.get("category", item.get("category", "tech"))
        item["tags"] = json.dumps(result.get("tags", [item.get("source", "unknown")]), ensure_ascii=False)

    except Exception:
        # Keep original category/tags
        if not item.get("category"):
            item["category"] = "tech"
        if not item.get("tags") or item["tags"] == "[]":
            item["tags"] = '["' + item.get("source", "unknown") + '"]'

    return item

"""MCP Client — calls MCP tools (local or remote).

Can connect to:
1. Built-in tools (via tools.execute_tool)
2. External MCP servers (via MCP protocol stdio/SSE)
"""

from typing import Any, Optional
from .tools import execute_tool, ALL_TOOLS


class MCPClient:
    """Client for invoking MCP tools.

    By default, uses local tool implementations.
    Can be extended to connect to remote MCP servers.
    """

    def __init__(self, remote_url: Optional[str] = None):
        self.remote_url = remote_url
        self._tools = {t["name"]: t for t in ALL_TOOLS}

    @property
    def available_tools(self) -> list[dict]:
        return list(self._tools.values())

    async def call_tool(self, name: str, arguments: dict | None = None) -> Any:
        """Call an MCP tool by name with optional arguments."""
        if name not in self._tools:
            raise ValueError(f"Unknown tool: {name}. Available: {list(self._tools.keys())}")

        if self.remote_url:
            return await self._call_remote(name, arguments or {})

        return await execute_tool(name, arguments or {})

    async def _call_remote(self, name: str, arguments: dict) -> Any:
        """Call a tool on a remote MCP server via HTTP."""
        import httpx
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{self.remote_url}/tools/{name}",
                json=arguments,
            )
            resp.raise_for_status()
            return resp.json()

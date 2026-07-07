"""MCP Server — wraps data source tools in an MCP-compatible server.

Can be run standalone via `mcp run server.py` or embedded in the FastAPI app.
"""

from mcp.server import Server, NotificationOptions
from mcp.server.models import InitializationOptions
import mcp.server.stdio
from mcp.types import (
    GetPromptResult,
    Prompt,
    PromptMessage,
    TextContent,
    Tool,
)
from .tools import ALL_TOOLS, execute_tool


class MCPServer:
    """MCP-compatible server exposing TechVanguard tools."""

    def __init__(self):
        self.server = Server("techvanguard")

        # Register tool handlers
        self.server.list_tools()(self._list_tools)
        self.server.call_tool()(self._call_tool)

    async def _list_tools(self) -> list[Tool]:
        return [Tool(**t) for t in ALL_TOOLS]

    async def _call_tool(self, name: str, arguments: dict) -> list[TextContent]:
        result = await execute_tool(name, arguments)
        text = str(result)
        return [TextContent(type="text", text=text)]

    async def run_stdio(self):
        """Run the MCP server over stdio (for `mcp run` command)."""
        async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
            await self.server.run(
                read_stream,
                write_stream,
                InitializationOptions(
                    server_name="techvanguard",
                    server_version="1.0.0",
                ),
            )


def main():
    """Entry point for `python -m mcp.tools` or `mcp run`."""
    import asyncio
    server = MCPServer()
    asyncio.run(server.run_stdio())


if __name__ == "__main__":
    main()

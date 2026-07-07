"""MCP (Model Context Protocol) package.

Implements both an MCP Server (exposing data sources as tools)
and an MCP Client (for use by agents).
"""

from .server import MCPServer
from .client import MCPClient
from .tools import ALL_TOOLS, execute_tool

__all__ = ["MCPServer", "MCPClient", "ALL_TOOLS", "execute_tool"]

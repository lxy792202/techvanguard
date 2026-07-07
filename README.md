# 🔭 TechVanguard · 前沿瞭望

> **多智能体驱动的前沿技术追踪平台**
>
> 自动从全球多个数据源采集最新技术资讯 → AI 摘要翻译 → 智能分类 → 趋势分析

[![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![MCP](https://img.shields.io/badge/MCP-1.0-635bff)](https://modelcontextprotocol.io/)
[![DeepSeek](https://img.shields.io/badge/DeepSeek-LLM-4A6CF7)](https://deepseek.com/)

---

## 系统架构

```
                     ┌─────────────────────────┐
                     │     Next.js 16 前端      │
                     │  shadcn/ui · Recharts    │
                     │  SSE 实时进度流          │
                     └───────────┬─────────────┘
                                 │ HTTP + SSE
                     ┌───────────▼─────────────┐
                     │     FastAPI 后端          │
                     │  Agent 编排 · MCP 层     │
                     └───────────┬─────────────┘
          ┌──────────┬───────────┼───────────┬──────────┐
          ▼          ▼           ▼           ▼          ▼
    ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
    │ arXiv  │ │ GitHub │ │ Hacker │ │  RSS   │ │ (知乎) │
    │  MCP   │ │  MCP   │ │ News   │ │  MCP   │ │  可选  │
    └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
                              ┌──────────────┐
                              │  ChromaDB    │
                              │  (向量去重)   │
                              └──────────────┘
```

### 数据流

```
定时触发 → [采集 Agent] → [MCP 工具]
    → [去重 (ChromaDB)] → [摘要 Agent (DeepSeek)]
    → [分类 Agent] → [入库] → [SSE 推送到前端]
```

---

## 核心技术栈

| 层 | 技术 | 亮点 |
|----|------|------|
| **前端** | Next.js 16 + shadcn/ui + Tailwind CSS + Recharts | 实时 Agent 进度流、趋势图表、暗黑模式 |
| **后端** | FastAPI + SQLAlchemy + APScheduler | 异步 API、定时采集、SSE 推送 |
| **Agent 编排** | 自研 Pipeline | 采集→去重→摘要→分类→趋势 五段流水线 |
| **MCP 协议** | Python MCP SDK | 自定义 MCP Server + Client，数据源封装为标准工具 |
| **向量数据库** | ChromaDB | 语义去重、相似推荐、语义搜索 |
| **AI 模型** | DeepSeek API | 中文摘要生成、自动分类、趋势分析 |
| **容器化** | Docker + Docker Compose | 一键部署 |

---

## 功能特性

- ✅ **多源采集** — arXiv 论文、GitHub Trending、Hacker News、RSS 订阅（可配置）
- ✅ **AI 中文摘要** — DeepSeek 自动翻译 + 生成中文摘要，降低阅读门槛
- ✅ **智能分类** — 论文 / 技术 / 工具 / 观点 自动分类，技术标签提取
- ✅ **热度评分** — 综合源站指标评分，热点一目了然
- ✅ **趋势分析** — 热词统计 + 话题趋势时间线 + AI 趋势总结
- ✅ **实时进度** — SSE 推送 Agent 采集和处理进度到前端
- ✅ **语义搜索** — ChromaDB 向量搜索，支持自然语言查询
- ✅ **定时采集** — APScheduler 自动周期性采集更新
- ✅ **手动刷新** — 一键触发即时采集

---

## 快速启动

### 方式一：本地运行

**前置条件**：Node.js 18+、Python 3.10+、[DeepSeek API Key](https://platform.deepseek.com/api_keys)

```bash
# 1. 克隆项目
git clone https://github.com/你的用户名/techvanguard.git
cd techvanguard

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 DEEPSEEK_API_KEY

# 3. 启动后端
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000 &
cd ..

# 4. 启动前端
cd frontend
npm install
npm run dev
cd ..

# 5. 打开浏览器
open http://localhost:3000
```

或使用一键脚本：

```bash
bash start.sh
```

### 方式二：Docker 部署

```bash
docker compose up -d
```

访问 http://localhost:3000

---

## 项目结构

```
techvanguard/
├── frontend/               # Next.js 16
│   ├── app/               # 页面 (首页/详情/趋势)
│   ├── components/        # UI 组件
│   └── lib/               # API 客户端 + 工具
│
├── backend/               # FastAPI
│   ├── main.py           # API 入口
│   ├── agents/           # Agent 编排层
│   ├── mcp/              # MCP Server + Client + 工具
│   ├── collector/        # 数据采集层
│   ├── scheduler.py      # 定时任务
│   └── models.py         # 数据模型
│
├── Dockerfile
├── docker-compose.yml
├── start.sh
└── README.md
```

---

## API 概览

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/items` | GET | 获取资讯列表（支持分类/来源/排序/分页） |
| `/api/items/{id}` | GET | 获取单条详情 |
| `/api/collect` | POST | 触发数据采集 |
| `/api/search?q=` | GET | 语义搜索 |
| `/api/trends` | GET | 趋势数据 |
| `/api/sse/{session}` | GET | SSE 实时进度流 |

完整 API 文档：`http://localhost:8000/docs`

---



MIT

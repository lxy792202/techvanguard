/** TechVanguard API client */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface Item {
  id: number
  source: string
  source_id: string
  title: string
  url: string
  summary_zh: string
  raw_text: string
  category: string
  tags: string
  score: number
  trend_score: number
  published_at: string | null
  collected_at: string | null
}

export interface ItemListResponse {
  items: Item[]
  total: number
}

export interface TrendData {
  keywords: { word: string; count: number; trend: string }[]
  timeline: { date: string; category: string; count: number }[]
  summary?: string
}

export async function fetchItems(params?: {
  category?: string
  source?: string
  sort?: string
  limit?: number
  offset?: number
}): Promise<ItemListResponse> {
  const search = new URLSearchParams()
  if (params?.category) search.set("category", params.category)
  if (params?.source) search.set("source", params.source)
  if (params?.sort) search.set("sort", params.sort)
  if (params?.limit) search.set("limit", String(params.limit))
  if (params?.offset) search.set("offset", String(params.offset))

  const res = await fetch(`${API_BASE}/api/items?${search.toString()}`)
  if (!res.ok) throw new Error("Failed to fetch items")
  return res.json()
}

export async function fetchItem(id: number): Promise<Item> {
  const res = await fetch(`${API_BASE}/api/items/${id}`)
  if (!res.ok) throw new Error("Failed to fetch item")
  return res.json()
}

export async function triggerCollect(sources?: string[]) {
  const res = await fetch(`${API_BASE}/api/collect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sources }),
  })
  if (!res.ok) throw new Error("Failed to trigger collection")
  return res.json()
}

export async function searchItems(q: string): Promise<ItemListResponse> {
  const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(q)}`)
  if (!res.ok) throw new Error("Failed to search")
  return res.json()
}

export async function fetchTrends(): Promise<TrendData> {
  const res = await fetch(`${API_BASE}/api/trends`)
  if (!res.ok) throw new Error("Failed to fetch trends")
  return res.json()
}

export function createSSEConnection(
  sessionId: string = "default",
  onProgress: (data: any) => void,
  onComplete: (data: any) => void,
  onError?: (err: any) => void,
): EventSource {
  const es = new EventSource(`${API_BASE}/api/sse/${sessionId}`)
  es.addEventListener("progress", (e) => onProgress(JSON.parse(e.data)))
  es.addEventListener("complete", (e) => onComplete(JSON.parse(e.data)))
  es.onerror = (e) => onError?.(e)
  return es
}

/** Category display config */
export const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  paper: { label: "论文", icon: "📄", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  tech: { label: "技术", icon: "💡", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  tool: { label: "工具", icon: "🛠️", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  opinion: { label: "观点", icon: "💬", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
}

export function getCategoryLabel(cat: string): string {
  return CATEGORY_CONFIG[cat]?.label || cat
}

export function getCategoryIcon(cat: string): string {
  return CATEGORY_CONFIG[cat]?.icon || "📌"
}

export const SOURCE_LABELS: Record<string, string> = {
  arxiv: "arXiv",
  github: "GitHub",
  hackernews: "Hacker News",
  rss: "RSS",
  zhihu: "知乎",
}

"use client"

import { useEffect, useState } from "react"
import {
  Search, RefreshCw, TrendingUp, Sparkles, Zap,
  BookOpen, Newspaper, Rss, Clock, Star, ArrowUpRight, ArrowRight,
  Bell, Bot, Loader2, Code2, Layers, Globe, Activity, Database,
  Shield, MessageSquare, Radio, Cpu, Flame,
  ExternalLink, Award
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import AgentStream from "@/components/AgentStream"
import { fetchItems, searchItems, fetchDigest, triggerCollect, CATEGORY_CONFIG, SOURCE_LABELS, type Item, type DigestData, type DigestSection } from "@/lib/api"
import Link from "next/link"

// ── Helpers ──
function timeAgo(d: string | null): string {
  if (!d) return ""
  const diff = Date.now() - new Date(d).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return "刚刚"
  if (h < 24) return `${h}小时前`
  return `${Math.floor(h / 24)}天前`
}

const QUICK_TAGS = ["LLM", "Agent", "MCP", "RAG", "多模态", "MoE"]
const CAT_PILLS = [["all", "全部"], ["paper", "📄 论文"], ["tech", "💡 技术"], ["tool", "🛠️ 工具"], ["opinion", "💬 观点"]]

const SOURCE_META: Record<string, { icon: any; color: string; gradient: string }> = {
  arxiv: { icon: BookOpen, color: "text-red-500", gradient: "from-red-500 to-rose-600" },
  github: { icon: Code2, color: "text-gray-500", gradient: "from-gray-600 to-gray-700" },
  hackernews: { icon: Newspaper, color: "text-orange-500", gradient: "from-orange-500 to-orange-600" },
  rss: { icon: Rss, color: "text-yellow-500", gradient: "from-yellow-500 to-orange-500" },
}

const COMPANIES = [
  { name: "OpenAI", icon: Sparkles, bg: "bg-green-500/10", text: "text-green-600" },
  { name: "Anthropic", icon: Shield, bg: "bg-amber-500/10", text: "text-amber-600" },
  { name: "DeepSeek", icon: Cpu, bg: "bg-blue-500/10", text: "text-blue-600" },
  { name: "Google", icon: Radio, bg: "bg-red-500/10", text: "text-red-600" },
  { name: "Meta", icon: MessageSquare, bg: "bg-cyan-500/10", text: "text-cyan-600" },
]

export default function Home() {
  const [items, setItems] = useState<Item[]>([])
  const [total, setTotal] = useState(0)
  const [category, setCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [digest, setDigest] = useState<DigestData | null>(null)
  const [digestLoading, setDigestLoading] = useState(false)

  const loadItems = async (cat?: string) => {
    setIsLoading(true)
    try {
      const r = await fetchItems({ category: cat && cat !== "all" ? cat : undefined, sort: "score", limit: 60 })
      setItems(r.items); setTotal(r.total)
    } catch (e) { console.error(e) }
    setIsLoading(false)
  }

  const loadDigest = async () => {
    setDigestLoading(true)
    try { const d = await fetchDigest(); setDigest(d) } catch (e) { console.error(e) }
    setDigestLoading(false)
  }

  useEffect(() => { loadItems(category) }, [category])
  useEffect(() => { if (total > 0) loadDigest() }, [total])

  const handleSearch = async () => {
    if (!searchQuery.trim()) { loadItems(category); return }
    setIsLoading(true)
    try { const r = await searchItems(searchQuery); setItems(r.items); setTotal(r.total) } catch (e) { console.error(e) }
    setIsLoading(false)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try { await triggerCollect(); setTimeout(() => { loadItems(category); setIsRefreshing(false) }, 3000) } catch (e) { setIsRefreshing(false) }
  }

  const featured = items[0]
  const hotItems = items.slice(1, 6)
  const paperItems = items.filter(i => i.category === "paper").slice(0, 3)
  const srcCount: Record<string, number> = {}
  items.forEach(i => { srcCount[i.source] = (srcCount[i.source] || 0) + 1 })

  function parseTags(item: Item): string[] {
    try { return JSON.parse(item.tags) } catch { return [] }
  }

  return (
    <div className="flex h-full w-full gap-3">
      {/* ═══ LEFT SIDEBAR ═══ */}
      <aside className="hidden w-52 shrink-0 flex-col gap-3 lg:flex">
        {/* Logo */}
        <div className="rounded-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500 p-4 shadow-lg shadow-purple-500/20">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-sm font-bold text-white">TechVanguard</h2>
          <p className="mt-0.5 text-[10px] text-white/60">前沿瞭望 · AI 驱动</p>
        </div>

        {/* Data sources */}
        <div>
          <h3 className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">数据源</h3>
          <div className="space-y-1.5">
            {Object.entries(SOURCE_META).map(([key, m]) => (
              <div key={key} className="flex items-center gap-2.5 rounded-xl border bg-card p-2.5 shadow-sm">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${m.gradient} shadow-sm`}>
                  <m.icon className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium">{SOURCE_LABELS[key] || key}</div>
                  <div className="text-[9px] text-muted-foreground">{srcCount[key] || 0} 条</div>
                </div>
                <span className={`h-2 w-2 rounded-full ${srcCount[key] ? "bg-green-500" : "bg-muted-foreground/30"}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { icon: Database, label: "总数据", value: String(total) },
            { icon: Globe, label: "数据源", value: String(Object.keys(srcCount).length || 0) },
            { icon: Sparkles, label: "AI 摘要", value: String(items.filter(i => i.summary_zh).length) },
            { icon: Activity, label: "更新", value: "30min" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-card p-2.5 text-center shadow-sm">
              <s.icon className="mx-auto mb-0.5 h-3.5 w-3.5 text-muted-foreground" />
              <div className="text-sm font-bold">{s.value}</div>
              <div className="text-[8px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Companies */}
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b border-border/30 bg-gradient-to-r from-blue-500/10 to-cyan-500/5 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-blue-500" />
              <h3 className="text-xs font-bold">热门厂商</h3>
            </div>
          </div>
          <div className="space-y-1.5 p-3">
            {COMPANIES.map((c) => (
              <div key={c.name} className={`flex items-center gap-2.5 rounded-xl ${c.bg} px-3 py-2.5`}>
                <c.icon className={`h-4 w-4 ${c.text}`} />
                <span className="flex-1 text-xs font-medium">{c.name}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {/* Top Bar */}
        <div className="flex items-center gap-2 rounded-2xl border bg-card px-4 py-2.5 shadow-sm">
          <div className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 px-3 py-1.5 shadow-sm">
            <span className="text-xs font-bold text-white">TechVanguard</span>
          </div>
          <div className="relative ml-2 max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="搜索前沿技术..." className="h-8 rounded-xl bg-muted/40 pl-8 text-xs"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()} />
          </div>
          <div className="ml-1 flex items-center gap-0.5 max-md:hidden">
            {["全部", "今日", "本周", "本月"].map(f => (
              <button key={f} className="rounded-lg px-2.5 py-1 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground">{f}</button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-xl p-0"><Bell className="h-4 w-4" /></Button>
            <Button variant="default" size="sm" className="h-8 gap-1.5 rounded-xl px-3 text-[10px] shadow-sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />刷新
            </Button>
          </div>
        </div>

        {/* Agent Stream */}
        <AgentStream />

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-muted/40 p-0.5">
            {CAT_PILLS.map(([k, lbl]) => (
              <button key={k} onClick={() => setCategory(k)}
                className={`rounded-lg px-3 py-1 text-xs transition-colors ${category === k ? "bg-card font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >{lbl}</button>
            ))}
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {QUICK_TAGS.map(t => (
              <span key={t} className="cursor-pointer rounded-lg border border-border/40 px-2.5 py-1 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground">{t}</span>
            ))}
          </div>
        </div>

        {/* ── HERO ── */}
        {featured ? (
          <Link href={`/detail/${featured.id}`}>
            <div className="cursor-pointer overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-md">
              <div className="relative h-40 overflow-hidden" style={{ background: "#0a0a1a" }}>
                <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 20% 30%,rgba(124,58,237,0.35) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 80% 70%,rgba(59,130,246,0.25) 0%,transparent 60%),radial-gradient(ellipse 40% 40% at 50% 30%,rgba(236,72,153,0.15) 0%,transparent 50%)" }} />
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
                <div className="absolute" style={{ top: "20%", left: "25%", width: "4px", height: "4px", borderRadius: "50%", background: "#a78bfa", boxShadow: "0 0 20px #a78bfa" }} />
                <div className="absolute" style={{ top: "55%", left: "70%", width: "3px", height: "3px", borderRadius: "50%", background: "#60a5fa", boxShadow: "0 0 15px #60a5fa" }} />
                <div className="absolute" style={{ top: "35%", left: "80%", width: "2px", height: "2px", borderRadius: "50%", background: "#f472b6", boxShadow: "0 0 12px #f472b6" }} />
                <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: "linear-gradient(to top,#0a0a1a,transparent)" }} />
                <div className="absolute left-3 right-3 top-3 z-10 flex gap-2">
                  <span className="rounded-full border border-white/20 bg-white/15 px-2.5 py-0.5 text-[10px] text-white backdrop-blur-md">{CATEGORY_CONFIG[featured.category]?.icon} {CATEGORY_CONFIG[featured.category]?.label}</span>
                  <span className="rounded-full border border-white/20 bg-white/15 px-2.5 py-0.5 text-[10px] text-white backdrop-blur-md">{SOURCE_LABELS[featured.source] || featured.source}</span>
                </div>
                <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full border border-white/20 bg-white/20 px-2.5 py-0.5 text-[10px] text-white backdrop-blur-md">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{featured.score.toFixed(0)}
                </div>
                <div className="absolute bottom-3 left-3 right-3 z-10">
                  <div className="mb-1 flex items-center gap-2 text-[10px] text-white/60">
                    <Flame className="h-3.5 w-3.5 text-rose-400" />
                    <span className="font-medium text-rose-400">精选推荐</span>
                    <span>🕐 {timeAgo(featured.collected_at)}</span>
                  </div>
                  <h2 className="text-lg font-bold leading-snug text-white">{featured.title}</h2>
                </div>
              </div>
              {featured.summary_zh && (
                <div className="p-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    <Sparkles className="mr-1 inline h-4 w-4 text-yellow-500" />
                    {featured.summary_zh}
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    {parseTags(featured).slice(0, 3).map(t => (
                      <span key={t} className="rounded-lg bg-muted px-2.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>
                    ))}
                    <span className="ml-auto flex items-center gap-1 text-xs font-medium text-primary">查看详情 <ArrowRight className="h-3.5 w-3.5" /></span>
                  </div>
                </div>
              )}
            </div>
          </Link>
        ) : !isLoading && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 py-20">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted"><Zap className="h-7 w-7 text-muted-foreground" /></div>
            <p className="mb-1 text-base font-medium text-muted-foreground">欢迎使用 TechVanguard</p>
            <p className="mb-5 text-xs text-muted-foreground/60">点击下方按钮，开始采集全球前沿技术资讯</p>
            <Button size="default" className="h-9 gap-2 rounded-xl text-xs shadow-sm" onClick={handleRefresh}><RefreshCw className="h-4 w-4" /> 开始采集</Button>
          </div>
        )}

        {/* ── HOT ROW ── */}
        {hotItems.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Flame className="h-4 w-4 text-rose-500" />
              <span className="text-xs font-bold">热点排行</span>
              <span className="text-[9px] text-muted-foreground">TOP {hotItems.length}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
              {hotItems.map((item, i) => {
                const rankColors = ["bg-rose-500", "bg-amber-500", "bg-blue-500", "bg-muted-foreground", "bg-muted-foreground"]
                return (
                  <Link key={item.id} href={`/detail/${item.id}`} className="shrink-0" style={{ width: "180px" }}>
                    <div className="rounded-2xl border bg-card p-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <span className={`flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold text-white ${rankColors[i]}`}>{i + 1}</span>
                        <span className="text-[9px] text-muted-foreground">{SOURCE_LABELS[item.source] || item.source}</span>
                      </div>
                      <p className="line-clamp-2 text-xs font-medium leading-snug">{item.title}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* ── DAILY DIGEST ── */}
        <div>
          {digestLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : digest ? (
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
              {/* Digest header */}
              <div className="border-b border-border/30 bg-gradient-to-r from-purple-600/5 via-blue-500/5 to-purple-600/5 px-5 py-4">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  <span>今日日报</span>
                  <span className="text-[9px]">AI 自动生成 · 基于 {total} 条资讯</span>
                </div>
                <h2 className="text-lg font-bold leading-snug">{digest.title}</h2>
              </div>

              {/* Digest body */}
              <div className="p-5 space-y-5">
                {digest.sections.map((section, i) => (
                  <div key={i}>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-[10px] text-primary">{i + 1}</span>
                      {section.topic}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {/* Replace [来源:id] markers with links */}
                      {section.content.split(/(\[来源:\d+\])/g).map((part, j) => {
                        const match = part.match(/\[来源:(\d+)\]/)
                        if (match) {
                          const id = parseInt(match[1])
                          const linkedItem = digest.items.find(it => it.id === id)
                          if (linkedItem) {
                            return (
                              <Link key={j} href={`/detail/${id}`} className="inline-flex items-center gap-0.5 text-primary hover:underline font-medium">
                                <ArrowUpRight className="h-3 w-3" />
                                <span>{SOURCE_LABELS[linkedItem.source] || linkedItem.source}</span>
                              </Link>
                            )
                          }
                          return <span key={j} className="text-primary"> [来源]</span>
                        }
                        return <span key={j}>{part}</span>
                      })}
                    </p>
                  </div>
                ))}
              </div>

              {/* Digest summary footer */}
              <div className="border-t border-border/30 bg-muted/20 px-5 py-3">
                <p className="text-xs text-muted-foreground">
                  <Sparkles className="inline h-3.5 w-3.5 mr-1 text-yellow-500" />
                  {digest.summary}
                </p>
              </div>

              {/* Referenced items list */}
              <div className="border-t border-border/30 px-5 py-3">
                <details>
                  <summary className="cursor-pointer text-[10px] text-muted-foreground hover:text-foreground">
                    查看引用来源 ({digest.items.length} 条)
                  </summary>
                  <div className="mt-2 space-y-1">
                    {digest.items.map(item => (
                      <Link key={item.id} href={`/detail/${item.id}`} className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-accent/50 transition-colors">
                        <span className="text-[10px]">{CATEGORY_CONFIG[item.category]?.icon}</span>
                        <span className="flex-1 text-[10px] truncate">{item.title}</span>
                        <span className="text-[8px] text-muted-foreground shrink-0">{SOURCE_LABELS[item.source] || item.source}</span>
                        <ArrowUpRight className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                      </Link>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          ) : (
            !featured && (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 py-16">
                <p className="text-xs text-muted-foreground">采集数据后将自动生成日报</p>
              </div>
            )
          )}
        </div>

        {/* ── PAPER RECOMMENDATIONS (bottom, small) ── */}
        {paperItems.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground">📄 论文推荐</span>
              <span className="text-[8px] text-muted-foreground">精选 {paperItems.length} 篇</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {paperItems.map(item => {
                const tags = parseTags(item)
                const grads = ["from-purple-500 to-blue-500", "from-rose-500 to-pink-500", "from-green-500 to-emerald-500"]
                return (
                  <Link key={item.id} href={`/detail/${item.id}`}>
                    <div className="overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md">
                      <div className={`h-1 bg-gradient-to-r ${grads[paperItems.indexOf(item)]}`} />
                      <div className="p-2.5">
                        <div className="mb-1 flex items-center gap-1.5 text-[9px] text-muted-foreground">
                          <span>📄</span><span>arXiv</span>
                          <span className="ml-auto flex items-center gap-0.5"><Star className="h-2 w-2 fill-yellow-400 text-yellow-400" />{item.score.toFixed(0)}</span>
                        </div>
                        <h3 className="line-clamp-2 text-[11px] font-semibold leading-snug">{item.title}</h3>
                        <p className="mt-0.5 line-clamp-1 text-[9px] text-muted-foreground">{item.summary_zh}</p>
                        <div className="mt-1.5 flex items-center gap-1">
                          {tags.slice(0, 2).map(t => <span key={t} className="rounded-md bg-muted/50 px-1.5 py-0.5 text-[7px] text-muted-foreground">{t}</span>)}
                          <span className="ml-auto text-[7px] text-muted-foreground">🕐 {timeAgo(item.collected_at)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

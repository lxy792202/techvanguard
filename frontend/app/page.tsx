"use client"

import { useEffect, useState } from "react"
import { Search, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import HotCard from "@/components/HotCard"
import ItemCard from "@/components/ItemCard"
import TrendChart from "@/components/TrendChart"
import AgentStream from "@/components/AgentStream"
import { fetchItems, searchItems, triggerCollect, CATEGORY_CONFIG, type Item } from "@/lib/api"

export default function Home() {
  const [items, setItems] = useState<Item[]>([])
  const [total, setTotal] = useState(0)
  const [category, setCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadItems = async (cat?: string) => {
    setIsLoading(true)
    try {
      const result = await fetchItems({
        category: cat && cat !== "all" ? cat : undefined,
        sort: "score",
        limit: 50,
      })
      setItems(result.items)
      setTotal(result.total)
    } catch (e) {
      console.error("Failed to load items", e)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadItems(category)
  }, [category])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadItems(category)
      return
    }
    setIsLoading(true)
    try {
      const result = await searchItems(searchQuery)
      setItems(result.items)
      setTotal(result.total)
    } catch (e) {
      console.error("Search failed", e)
    }
    setIsLoading(false)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await triggerCollect()
      setTimeout(() => {
        loadItems(category)
        setIsRefreshing(false)
      }, 3000)
    } catch (e) {
      setIsRefreshing(false)
    }
  }

  const hotItems = items.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Search + Refresh bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索前沿技术..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Agent Stream */}
      <AgentStream />

      {/* Hot section */}
      {hotItems.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            🔥 热点
            <span className="text-xs font-normal text-muted-foreground">
              最热 {hotItems.length} / 共 {total}
            </span>
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {hotItems.map((item) => (
              <HotCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Category Tabs + List */}
      <section>
        <Tabs value={category} onValueChange={setCategory} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">全部</TabsTrigger>
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <TabsTrigger key={key} value={key}>
                {cfg.icon} {cfg.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="space-y-3 lg:col-span-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                加载中...
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-sm text-muted-foreground">
                <p className="mb-2">暂无数据</p>
                <p className="text-xs">
                  点击右上角 <strong>刷新</strong> 按钮触发首次采集
                </p>
              </div>
            ) : (
              items.slice(0, 30).map((item) => (
                <ItemCard key={item.id} item={item} />
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden space-y-4 lg:block">
            <TrendChart items={items} />
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 text-sm font-semibold">📡 数据源</h3>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p>• arXiv 论文</p>
                <p>• GitHub Trending</p>
                <p>• Hacker News</p>
                <p>• RSS 订阅</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

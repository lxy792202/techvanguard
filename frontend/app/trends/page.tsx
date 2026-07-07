"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { fetchTrends, type TrendData } from "@/lib/api"
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts"

export default function TrendsPage() {
  const [data, setData] = useState<TrendData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrends()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        加载趋势数据...
      </div>
    )
  }

  const trendColors: Record<string, string> = {
    up: "text-green-500",
    stable: "text-yellow-500",
    down: "text-red-500",
  }

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-500" />
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-yellow-500" />
  }

  // Prepare timeline chart data
  const timelineData = data?.timeline?.reduce<Record<string, any>>((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = { date: item.date }
    }
    acc[item.date][item.category] = item.count
    return acc
  }, {}) ?? {}

  const chartData = Object.values(timelineData)
  const categories = [...new Set(data?.timeline?.map((t) => t.category) ?? [])]

  const CATEGORY_CHART_COLORS: Record<string, string> = {
    paper: "#3b82f6",
    tech: "#8b5cf6",
    tool: "#22c55e",
    opinion: "#f97316",
  }

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 返回首页
      </Link>

      <h1 className="text-xl font-bold">📈 趋势看板</h1>

      {/* Keywords */}
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">🏷️ 热门话题</h2>
        <div className="flex flex-wrap gap-2">
          {data?.keywords?.map((kw) => (
            <Badge
              key={kw.word}
              variant="outline"
              className="flex items-center gap-1 px-3 py-1.5 text-sm"
            >
              {kw.word}
              <span className="text-xs text-muted-foreground">({kw.count})</span>
              <TrendIcon trend={kw.trend} />
            </Badge>
          )) ?? <span className="text-sm text-muted-foreground">暂无数据</span>}
        </div>
      </Card>

      {/* Timeline Chart */}
      <Card className="p-4">
        <h2 className="mb-4 text-sm font-semibold">📊 话题趋势时间线</h2>
        {chartData.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {categories.map((cat) => (
                  <Bar
                    key={cat}
                    dataKey={cat}
                    name={cat}
                    fill={CATEGORY_CHART_COLORS[cat] || "#888"}
                    stackId="a"
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            采集数据后自动生成趋势图
          </p>
        )}
      </Card>

      {/* Summary */}
      <Card className="border-l-4 border-l-primary p-4">
        <h2 className="mb-1 text-sm font-semibold">📋 趋势总结</h2>
        <p className="text-sm text-muted-foreground">
          {data?.summary ?? "暂无数据"}
        </p>
      </Card>
    </div>
  )
}

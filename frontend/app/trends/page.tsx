"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { fetchTrends, type TrendData } from "@/lib/api"
import { ArrowLeft, TrendingUp, TrendingDown, Minus, BarChart3, Hash, Sparkles } from "lucide-react"
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

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-500" />
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-yellow-500" />
  }

  const timelineData = data?.timeline?.reduce<Record<string, any>>((acc, item) => {
    if (!acc[item.date]) acc[item.date] = { date: item.date }
    acc[item.date][item.category] = (acc[item.date][item.category] || 0) + item.count
    return acc
  }, {}) ?? {}

  const chartData = Object.values(timelineData)
  const categories = [...new Set(data?.timeline?.map((t) => t.category) ?? [])]

  const CATEGORY_CHART_COLORS: Record<string, string> = {
    paper: "#6366f1",
    tech: "#8b5cf6",
    tool: "#22c55e",
    opinion: "#f97316",
  }

  const CATEGORY_LABELS: Record<string, string> = {
    paper: "论文",
    tech: "技术",
    tool: "工具",
    opinion: "观点",
  }

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> 返回首页
      </Link>

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-blue-500 p-6 shadow-xl shadow-purple-500/20">
        <div className="flex items-center gap-2 text-sm font-medium text-white/80">
          <BarChart3 className="h-4 w-4" />
          <span>数据分析</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold text-white">趋势看板</h1>
        <p className="mt-1 text-sm text-white/60">热门话题与数据趋势一览</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="shimmer h-24 rounded-xl" />
          <div className="shimmer h-72 rounded-xl" />
        </div>
      ) : (
        <>
          {/* Keywords */}
          <Card className="overflow-hidden border p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Hash className="h-4 w-4 text-primary" />
              热门话题
            </h2>
            {data?.keywords?.length ? (
              <div className="flex flex-wrap gap-2">
                {data.keywords.map((kw) => (
                  <Badge
                    key={kw.word}
                    variant="outline"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs shadow-sm transition-all hover:shadow-md hover:border-primary/30"
                  >
                    {kw.word}
                    <span className="text-muted-foreground">({kw.count})</span>
                    <TrendIcon trend={kw.trend} />
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">暂无数据</p>
            )}
          </Card>

          {/* Timeline Chart */}
          <Card className="overflow-hidden border p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <BarChart3 className="h-4 w-4 text-primary" />
              趋势时间线
            </h2>
            {chartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid oklch(0.9 0.02 260 / 0.5)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Legend
                      formatter={(value) => <span className="text-xs">{CATEGORY_LABELS[value] || value}</span>}
                    />
                    {categories.map((cat) => (
                      <Bar
                        key={cat}
                        dataKey={cat}
                        name={cat}
                        fill={CATEGORY_CHART_COLORS[cat] || "#888"}
                        stackId="a"
                        radius={[2, 2, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground">
                <BarChart3 className="mb-2 h-8 w-8 text-muted-foreground/40" />
                <p>采集数据后自动生成趋势图</p>
              </div>
            )}
          </Card>

          {/* Summary */}
          {data?.summary && (
            <Card className="border-l-4 border-l-primary p-5 shadow-sm">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                趋势总结
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{data.summary}</p>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

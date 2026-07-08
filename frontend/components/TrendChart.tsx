"use client"

import { Card } from "@/components/ui/card"
import { CATEGORY_CONFIG, type Item } from "@/lib/api"

interface TrendChartProps {
  items: Item[]
}

export default function TrendChart({ items }: TrendChartProps) {
  const counts: Record<string, number> = {}
  items.forEach((item) => {
    counts[item.category] = (counts[item.category] || 0) + 1
  })

  const maxCount = Math.max(...Object.values(counts), 1)
  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  if (Object.keys(counts).length === 0) return null

  return (
    <Card className="overflow-hidden border p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold flex items-center gap-2">
        <span className="text-base">📊</span> 内容分布
      </h3>
      <div className="space-y-3">
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
          const count = counts[key] || 0
          const pct = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={key}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span>{cfg.icon}</span>
                  <span className="font-medium">{cfg.label}</span>
                </span>
                <span className="text-muted-foreground">
                  {count}
                  <span className="ml-1 text-[10px]">({pct.toFixed(0)}%)</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-500"
                  style={{ width: `${Math.max(pct, 1)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

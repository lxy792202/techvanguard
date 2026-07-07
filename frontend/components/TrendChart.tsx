"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { CATEGORY_CONFIG, type Item } from "@/lib/api"

interface TrendChartProps {
  items: Item[]
}

export default function TrendChart({ items }: TrendChartProps) {
  // Count categories
  const counts: Record<string, number> = {}
  items.forEach((item) => {
    counts[item.category] = (counts[item.category] || 0) + 1
  })

  const maxCount = Math.max(...Object.values(counts), 1)

  if (Object.keys(counts).length === 0) return null

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-semibold">📊 分类分布</h3>
      <div className="space-y-2">
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
          const count = counts[key] || 0
          const pct = (count / maxCount) * 100
          return (
            <div key={key}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span>
                  {cfg.icon} {cfg.label}
                </span>
                <span className="text-muted-foreground">{count}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/60 transition-all"
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

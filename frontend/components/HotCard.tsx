"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCategoryLabel, getCategoryIcon, SOURCE_LABELS, type Item } from "@/lib/api"
import { Clock, Star, TrendingUp } from "lucide-react"

export default function HotCard({ item }: { item: Item }) {
  const timeAgo = item.collected_at
    ? (() => {
        const diff = Date.now() - new Date(item.collected_at).getTime()
        const hours = Math.floor(diff / 3600000)
        if (hours < 1) return "刚刚"
        if (hours < 24) return `${hours}小时前`
        return `${Math.floor(hours / 24)}天前`
      })()
    : ""

  return (
    <Link href={`/detail/${item.id}`}>
      <Card className="group flex items-start gap-3 border-l-4 border-l-primary/60 p-3 transition-all hover:bg-accent/50 hover:shadow-sm">
        <span className="mt-0.5 text-lg">{getCategoryIcon(item.category)}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {getCategoryLabel(item.category)}
            </Badge>
            <span className="text-[11px] text-muted-foreground">
              {SOURCE_LABELS[item.source] || item.source}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {item.title}
          </p>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
            {timeAgo && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {timeAgo}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3" /> {item.score.toFixed(0)}
            </span>
            {item.trend_score > 0 && (
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> {item.trend_score.toFixed(0)}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}

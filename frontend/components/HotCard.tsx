"use client"

import Link from "next/link"
import { getCategoryLabel, getCategoryIcon, SOURCE_LABELS, type Item } from "@/lib/api"
import { Clock, Star } from "lucide-react"

export default function HotCard({ item, rank }: { item: Item; rank: number }) {
  const timeAgo = item.collected_at
    ? (() => {
        const diff = Date.now() - new Date(item.collected_at).getTime()
        const h = Math.floor(diff / 3600000)
        return h < 1 ? "刚刚" : h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`
      })()
    : ""

  const rankColors = ["bg-rose-500", "bg-amber-500", "bg-blue-500", "bg-muted-foreground", "bg-muted-foreground"]

  return (
    <Link href={`/detail/${item.id}`}>
      <div className="card-lift group flex items-center gap-2.5 rounded-lg border bg-card p-2.5 shadow-sm">
        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${rankColors[rank] || "bg-muted"}`}>
          <span className="text-[10px] font-bold text-white">{rank + 1}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">{getCategoryIcon(item.category)}</span>
            <span className="text-[10px] text-muted-foreground">{SOURCE_LABELS[item.source] || item.source}</span>
          </div>
          <p className="mt-0.5 text-xs font-medium leading-snug group-hover:text-primary transition-colors line-clamp-1">
            {item.title}
          </p>
          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
            {timeAgo && <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{timeAgo}</span>}
            <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />{item.score.toFixed(0)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

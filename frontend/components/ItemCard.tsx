"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { getCategoryLabel, getCategoryIcon, SOURCE_LABELS, type Item } from "@/lib/api"
import { Star, Sparkles, ArrowUpRight } from "lucide-react"

export default function ItemCard({ item }: { item: Item }) {
  let tags: string[] = []
  try { tags = JSON.parse(item.tags) } catch { tags = [] }

  const sourceBorders: Record<string, string> = {
    arxiv: "border-l-red-500/40",
    github: "border-l-gray-500/40",
    hackernews: "border-l-orange-500/40",
    rss: "border-l-yellow-500/40",
  }

  return (
    <Link href={`/detail/${item.id}`}>
      <div className={`card-lift group relative flex items-start gap-3 rounded-lg border border-l-[3px] bg-card p-3 shadow-sm ${sourceBorders[item.source] || "border-l-primary/20"}`}>
        {/* Icon */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-sm">
          {getCategoryIcon(item.category)}
        </div>

        <div className="min-w-0 flex-1">
          {/* Top row */}
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Badge variant="outline" className="px-1.5 py-0 text-[9px] leading-none">{getCategoryLabel(item.category)}</Badge>
            <span>{SOURCE_LABELS[item.source] || item.source}</span>
            <span className="ml-auto flex items-center gap-0.5">
              <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
              {item.score.toFixed(0)}
            </span>
          </div>

          {/* Title */}
          <p className="mt-1 text-xs font-medium leading-snug group-hover:text-primary transition-colors line-clamp-1">
            {item.title}
          </p>

          {/* AI Summary - compact */}
          {item.summary_zh && (
            <div className="mt-1 flex gap-1.5 rounded-md bg-yellow-500/5 px-2 py-1">
              <Sparkles className="mt-0.5 h-2.5 w-2.5 shrink-0 text-yellow-500" />
              <p className="text-[10px] leading-relaxed text-muted-foreground line-clamp-1">{item.summary_zh}</p>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {tags.slice(0, 3).map((t) => (
                <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">{t}</span>
              ))}
            </div>
          )}
        </div>

        <ArrowUpRight className="mt-1 h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  )
}

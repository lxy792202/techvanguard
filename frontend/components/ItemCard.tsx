"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCategoryLabel, getCategoryIcon, SOURCE_LABELS, type Item } from "@/lib/api"
import { Star, ExternalLink, Sparkles } from "lucide-react"

export default function ItemCard({ item }: { item: Item }) {
  let tags: string[] = []
  try {
    tags = JSON.parse(item.tags)
  } catch {
    tags = []
  }

  return (
    <Link href={`/detail/${item.id}`}>
      <Card className="group flex flex-col gap-2 p-4 transition-all hover:bg-accent/50 hover:shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 text-base">{getCategoryIcon(item.category)}</span>
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            {getCategoryLabel(item.category)}
          </Badge>
          <span>{SOURCE_LABELS[item.source] || item.source}</span>
          {item.score > 0 && (
            <span className="ml-auto flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {item.score.toFixed(0)}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {item.title}
        </h3>

        {/* AI Summary */}
        {item.summary_zh && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            <Sparkles className="mr-0.5 inline h-3 w-3 text-yellow-500" />
            {item.summary_zh}
          </p>
        )}

        {/* Tags + link */}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
          <span className="ml-auto opacity-0 transition-opacity group-hover:opacity-100">
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </span>
        </div>
      </Card>
    </Link>
  )
}

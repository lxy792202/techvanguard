"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { fetchItem, getCategoryLabel, getCategoryIcon, SOURCE_LABELS, type Item } from "@/lib/api"
import { ArrowLeft, ExternalLink, Star, Sparkles, Clock, Tag, ArrowUpRight } from "lucide-react"

export default function DetailPage() {
  const { id } = useParams()
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchItem(Number(id))
        .then(setItem)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [id])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="shimmer h-6 w-24 rounded-lg" />
        <div className="shimmer h-10 w-3/4 rounded-xl" />
        <div className="shimmer h-40 w-full rounded-xl" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <span className="text-2xl">🔍</span>
        </div>
        <p className="text-lg font-medium">未找到该内容</p>
        <Link href="/" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> 返回首页
        </Link>
      </div>
    )
  }

  let tags: string[] = []
  try {
    tags = JSON.parse(item.tags)
  } catch {
    tags = []
  }

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
    <div className="mx-auto max-w-4xl">
      {/* Back */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> 返回列表
      </Link>

      {/* Header Card */}
      <Card className="overflow-hidden border shadow-sm">
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-transparent p-6 pb-4">
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground mb-3">
            <span className="text-xl leading-none">{getCategoryIcon(item.category)}</span>
            <Badge variant="secondary" className="px-2 py-0.5 text-xs font-medium">
              {getCategoryLabel(item.category)}
            </Badge>
            <span className="font-medium">{SOURCE_LABELS[item.source] || item.source}</span>
            {timeAgo && (
              <span className="ml-auto flex items-center gap-1 text-xs">
                <Clock className="h-3.5 w-3.5" /> {timeAgo}
              </span>
            )}
          </div>

          <h1 className="text-xl font-bold leading-snug sm:text-2xl">{item.title}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              热度 {item.score.toFixed(0)}
            </Badge>
            {tags.slice(0, 5).map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 px-2.5 py-1 text-[10px]">
                <Tag className="h-2.5 w-2.5" /> {tag}
              </Badge>
            ))}
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
            >
              <ExternalLink className="h-3.5 w-3.5" /> 查看原文
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* AI Summary */}
        <div className="border-t border-border/50 p-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            AI 解读
          </h2>
          <div className="rounded-xl bg-gradient-to-r from-yellow-500/5 to-amber-500/5 p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {item.summary_zh || "暂无 AI 摘要（请设置 DEEPSEEK_API_KEY）"}
            </p>
          </div>
        </div>
      </Card>

      {/* Raw text */}
      {item.raw_text && (
        <details className="mt-4 overflow-hidden rounded-xl border shadow-sm">
          <summary className="flex cursor-pointer items-center gap-2 bg-muted/30 px-5 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <span className="text-base">📄</span> 查看原文内容
          </summary>
          <div className="border-t border-border/50 p-5">
            <pre className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground font-mono">
              {item.raw_text}
            </pre>
          </div>
        </details>
      )}
    </div>
  )
}

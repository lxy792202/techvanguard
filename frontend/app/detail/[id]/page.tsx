"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { fetchItem, getCategoryLabel, getCategoryIcon, SOURCE_LABELS, type Item } from "@/lib/api"
import { ArrowLeft, ExternalLink, Star, Sparkles, Clock, Tag } from "lucide-react"

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
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        加载中...
      </div>
    )
  }

  if (!item) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-medium">未找到</p>
        <Link href="/" className="mt-2 inline-block text-sm text-primary">
          返回首页
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
    <div className="max-w-4xl">
      {/* Back */}
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 返回
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="text-lg">{getCategoryIcon(item.category)}</span>
          <Badge variant="secondary">{getCategoryLabel(item.category)}</Badge>
          <span>{SOURCE_LABELS[item.source] || item.source}</span>
          {timeAgo && (
            <span className="flex items-center gap-1 ml-auto">
              <Clock className="h-3 w-3" /> {timeAgo}
            </span>
          )}
        </div>

        <h1 className="text-xl font-bold leading-snug">{item.title}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> {item.score.toFixed(0)}
          </Badge>
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              <Tag className="mr-0.5 h-2.5 w-2.5" /> {tag}
            </Badge>
          ))}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" /> 原文
          </a>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* AI Summary */}
      <Card className="mb-6 border-l-4 border-l-yellow-400 p-4">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          AI 解读
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {item.summary_zh || "暂无 AI 摘要（请设置 DEEPSEEK_API_KEY）"}
        </p>
      </Card>

      {/* Raw text */}
      {item.raw_text && (
        <details className="rounded-lg border p-4">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
            查看原文内容
          </summary>
          <pre className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
            {item.raw_text}
          </pre>
        </details>
      )}
    </div>
  )
}

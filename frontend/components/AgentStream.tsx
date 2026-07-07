"use client"

import { useEffect, useRef, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react"

interface ProgressEvent {
  source: string
  status: string
  message: string
  item_count: number
}

const STATUS_CONFIG: Record<string, { icon: any; color: string }> = {
  collecting: { icon: Loader2, color: "text-blue-500" },
  summarizing: { icon: Loader2, color: "text-purple-500" },
  saving: { icon: Loader2, color: "text-green-500" },
  done: { icon: CheckCircle2, color: "text-green-500" },
  error: { icon: AlertCircle, color: "text-red-500" },
}

export default function AgentStream() {
  const [events, setEvents] = useState<ProgressEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const es = new EventSource("http://localhost:8000/api/sse/default")
    esRef.current = es

    es.addEventListener("progress", (e) => {
      const data = JSON.parse(e.data) as ProgressEvent
      setEvents((prev) => [...prev.slice(-49), data])
      setIsConnected(true)
    })

    es.addEventListener("complete", (e) => {
      const data = JSON.parse(e.data) as ProgressEvent
      setEvents((prev) => [...prev.slice(-49), data])
      setIsConnected(true)
    })

    es.onerror = () => {
      setIsConnected(false)
    }

    return () => es.close()
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [events])

  if (events.length === 0 && !isConnected) return null

  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-semibold">Agent 进度</span>
        {isConnected ? (
          <Badge variant="outline" className="text-[10px] text-green-600">
            <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" /> 已连接
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            离线
          </Badge>
        )}
      </div>
      <ScrollArea className="h-28" ref={scrollRef}>
        <div className="space-y-1">
          {events.map((evt, i) => {
            const cfg = STATUS_CONFIG[evt.status] || STATUS_CONFIG.collecting
            const Icon = cfg.icon
            return (
              <div
                key={i}
                className="flex items-start gap-2 text-xs text-muted-foreground"
              >
                <Icon
                  className={`mt-0.5 h-3 w-3 shrink-0 ${cfg.color} ${evt.status === "collecting" || evt.status === "summarizing" || evt.status === "saving" ? "animate-spin" : ""}`}
                />
                <span className="font-medium shrink-0">{evt.source}:</span>
                <span className="truncate">{evt.message}</span>
                {evt.item_count > 0 && (
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    ({evt.item_count})
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

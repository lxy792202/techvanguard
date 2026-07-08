"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react"

interface ProgressEvent {
  source: string
  status: string
  message: string
  item_count: number
}

export default function AgentStream() {
  const [events, setEvents] = useState<ProgressEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [collapsed, setCollapsed] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const es = new EventSource("http://localhost:8000/api/sse/default")
    esRef.current = es
    es.addEventListener("progress", (e) => {
      const data = JSON.parse(e.data) as ProgressEvent
      setEvents((prev) => [...prev.slice(-29), data])
      setIsConnected(true)
    })
    es.addEventListener("complete", (e) => {
      const data = JSON.parse(e.data) as ProgressEvent
      setEvents((prev) => [...prev.slice(-29), data])
      setIsConnected(true)
    })
    es.onerror = () => setIsConnected(false)
    return () => es.close()
  }, [])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [events])

  if (events.length === 0 && !isConnected) return null

  const lastEvent = events[events.length - 1]

  return (
    <div className="rounded-lg border bg-muted/30">
      <button
        className="flex w-full items-center gap-2 px-3 py-1.5 text-[10px] text-muted-foreground hover:text-foreground"
        onClick={() => setCollapsed(!collapsed)}
      >
        {isConnected ? <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> : <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />}
        <span className="font-medium">Agent</span>
        {lastEvent && <span className="truncate">{lastEvent.message}</span>}
        <ChevronDown className={`ml-auto h-3 w-3 transition-transform ${collapsed ? "" : "rotate-180"}`} />
      </button>
      {!collapsed && (
        <div ref={scrollRef} className="max-h-24 overflow-y-auto border-t border-border/50 px-3 py-1.5">
          {events.map((evt, i) => {
            const isActive = ["collecting", "summarizing", "saving"].includes(evt.status)
            const Icon = isActive ? Loader2 : evt.status === "error" ? AlertCircle : CheckCircle2
            const color = evt.status === "error" ? "text-red-500" : isActive ? "text-blue-500" : "text-green-500"
            return (
              <div key={i} className="flex items-start gap-1.5 py-0.5 text-[10px] text-muted-foreground">
                <Icon className={`mt-0.5 h-2.5 w-2.5 shrink-0 ${color} ${isActive ? "animate-spin" : ""}`} />
                <span className="font-medium shrink-0">{evt.source}</span>
                <span className="truncate">{evt.message}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

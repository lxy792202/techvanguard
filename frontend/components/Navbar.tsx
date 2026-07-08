"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RssIcon, BarChart3Icon, Zap, SunMoon } from "lucide-react"
import { useState, useEffect } from "react"

export default function Navbar() {
  const pathname = usePathname()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"))
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle("dark", next)
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border/30 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-11 max-w-6xl items-center justify-between px-3 sm:px-4">
        <Link href="/" className="flex items-center gap-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-purple-600 to-blue-500">
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold">TechVanguard</span>
          <span className="hidden text-[10px] text-muted-foreground sm:inline">· 前沿瞭望</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/trends"
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
              pathname === "/trends" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">趋势</span>
          </Link>
          <button onClick={toggleTheme} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground" title="切换主题">
            <SunMoon className="h-3.5 w-3.5" />
          </button>
          <Button
            variant="default"
            size="sm"
            className="h-7 gap-1 rounded-md px-2.5 text-[10px] shadow-sm"
            onClick={() => {
              fetch("http://localhost:8000/api/collect", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => {})
            }}
          >
            <RssIcon className="h-3 w-3" />
            刷新
          </Button>
        </div>
      </div>
    </nav>
  )
}

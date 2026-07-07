"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RssIcon, BarChart3Icon, Gamepad2Icon } from "lucide-react"

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Gamepad2Icon className="h-5 w-5" />
          <span>TechVanguard</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">· 前沿瞭望</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/trends"
            className={`flex items-center gap-1 text-sm ${pathname === "/trends" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
          >
            <BarChart3Icon className="h-4 w-4" />
            <span className="hidden sm:inline">趋势</span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="ml-2 gap-1"
            onClick={() => {
              fetch("http://localhost:8000/api/collect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: "{}",
              }).catch(() => {})
            }}
          >
            <RssIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">刷新</span>
          </Button>
        </div>
      </div>
    </nav>
  )
}

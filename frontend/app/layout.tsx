import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/Navbar"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "TechVanguard · 前沿瞭望",
  description: "多智能体驱动的前沿技术追踪平台 — 采集全球技术资讯，AI 摘要分类，趋势分析",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
          {children}
        </main>
        <footer className="border-t py-4 text-center text-xs text-muted-foreground">
          TechVanguard · 前沿瞭望 · Built with Next.js + FastAPI + DeepSeek
        </footer>
      </body>
    </html>
  )
}

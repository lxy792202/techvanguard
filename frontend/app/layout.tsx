import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/Navbar"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TechVanguard · 前沿瞭望",
  description: "多智能体驱动的前沿技术追踪平台",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-screen flex-col bg-background">
        <div className="tech-bg" />
        <div className="grid-dots fixed inset-0 z-[-1] opacity-15" />
        <Navbar />
        <main className="flex-1 w-full px-2 py-2 sm:px-3 sm:py-3">
          {children}
        </main>
        <footer className="border-t border-border/30 py-2 text-center text-[9px] text-muted-foreground">
          TechVanguard · 前沿瞭望
        </footer>
      </body>
    </html>
  )
}

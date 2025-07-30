import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { ThemeWrapper } from "@/components/theme-wrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Savvi - Mobile Finance Tracker",
  description: "Track your finances with style",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased transition-colors duration-300`}>
        <Providers>
          <ThemeWrapper>
            <div className="min-h-screen w-full max-w-md mx-auto relative overflow-hidden">{children}</div>
          </ThemeWrapper>
        </Providers>
      </body>
    </html>
  )
}

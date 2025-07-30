"use client"

import type React from "react"

import { useEffect } from "react"
import { useSettings } from "@/contexts/settings-context"

interface ThemeWrapperProps {
  children: React.ReactNode
}

export function ThemeWrapper({ children }: ThemeWrapperProps) {
  const { darkMode } = useSettings()

  useEffect(() => {
    console.log("🎨 ThemeWrapper: Applying theme:", darkMode ? "dark" : "light")

    const html = document.documentElement
    const body = document.body

    // Remove all theme classes first
    html.classList.remove("dark", "light")
    body.classList.remove("dark", "light")

    // Apply new theme with correct colors
    if (darkMode) {
      html.classList.add("dark")
      body.classList.add("dark")
      body.style.backgroundColor = "#000000" // ✅ Hitam murni
      body.style.color = "#ffffff"
    } else {
      html.classList.add("light")
      body.classList.add("light")
      body.style.backgroundColor = "#f8fafc" // ✅ Abu-abu terang
      body.style.color = "#0f172a"
    }
  }, [darkMode])

  return <div className={`theme-wrapper ${darkMode ? "dark" : "light"}`}>{children}</div>
}

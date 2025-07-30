"use client"

import { useAuth } from "@/components/providers"
import { AuthScreen } from "@/components/auth-screen"
import { MainApp } from "@/components/main-app"
import { Loader2 } from "lucide-react"

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background theme-transition">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading savviFinance...</p>
        </div>
      </div>
    )
  }

  return user ? <MainApp /> : <AuthScreen />
}

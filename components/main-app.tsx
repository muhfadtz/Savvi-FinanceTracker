"use client"

import { useState, useEffect, useRef } from "react"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Dashboard } from "@/components/dashboard"
import { Transactions } from "@/components/transactions"
import { Goals } from "@/components/goals"
import { Owed } from "@/components/owed"
import { Profile } from "@/components/profile"
import { DatabaseSetup } from "@/components/database-setup"
import { ConnectionError } from "@/components/connection-error"
import { useAuth } from "@/components/providers"
import { useSettings } from "@/contexts/settings-context"
import { createClient } from "@/lib/supabase"
import { Loader2, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export type TabType = "dashboard" | "transactions" | "goals" | "owed" | "profile"

export interface MoneyBucket {
  id: string
  name: string
  balance: number
  user_id: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  amount: number
  type: "income" | "expense"
  category: string
  description?: string
  date: string
  bucket_id: string
  goal_allocation?: number
  goal_id?: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  title: string
  target_amount: number
  current_amount: number
  user_id: string
  completed: boolean
  created_at: string
  updated_at: string
}

export interface Debt {
  id: string
  amount: number
  person_name: string
  due_date?: string
  type: "owed_by_me" | "owed_to_me"
  paid: boolean
  user_id: string
  created_at: string
  updated_at: string
}

type AppState = "loading" | "connection-error" | "needs-setup" | "ready" | "offline-mode" | "error"

export function MainApp() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard")
  const [buckets, setBuckets] = useState<MoneyBucket[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [appState, setAppState] = useState<AppState>("loading")
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // ✅ FIX 8: Use ref to prevent multiple initialization
  const isInitialized = useRef(false)
  const supabaseRef = useRef(createClient())

  const { user, connectionStatus } = useAuth()
  const { darkMode } = useSettings()
  const supabase = supabaseRef.current

  // Computed values from single state
  const isOfflineMode = appState === "offline-mode"
  const isLoading = appState === "loading"
  const isReady = appState === "ready"

  // ✅ FIX 9: Only initialize once when conditions are met
  useEffect(() => {
    if (user && !isInitialized.current && connectionStatus !== "checking") {
      console.log("🚀 Initializing app for user:", user.email, "Connection:", connectionStatus)
      isInitialized.current = true

      if (connectionStatus === "disconnected") {
        console.log("🔌 Auth disconnected, entering offline mode")
        const hasOfflineData = loadOfflineData()
        if (hasOfflineData) {
          setAppState("offline-mode")
        } else {
          setAppState("connection-error")
        }
      } else {
        checkDatabaseSetup()
      }
    }
  }, [user, connectionStatus]) // ✅ FIX 10: Proper dependencies

  const loadOfflineData = () => {
    try {
      const offlineData = localStorage.getItem(`savvi-offline-${user?.id}`)
      if (offlineData) {
        const data = JSON.parse(offlineData)
        setBuckets(data.buckets || [])
        setTransactions(data.transactions || [])
        setGoals(data.goals || [])
        setDebts(data.debts || [])
        console.log("📱 Loaded offline data successfully")
        return true
      }
    } catch (err) {
      console.error("❌ Error loading offline data:", err)
    }
    return false
  }

  const saveOfflineData = (data: {
    buckets: MoneyBucket[]
    transactions: Transaction[]
    goals: Goal[]
    debts: Debt[]
  }) => {
    try {
      localStorage.setItem(`savvi-offline-${user?.id}`, JSON.stringify(data))
      console.log("💾 Saved data to offline storage")
    } catch (err) {
      console.error("❌ Error saving offline data:", err)
    }
  }

  const checkDatabaseSetup = async () => {
    console.log("🔍 Starting database setup check...")
    setAppState("loading")
    setError(null)

    try {
      const testQuery = supabase.from("money_buckets").select("id").limit(1)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database connection timeout")), 8000),
      )

      const { data, error } = (await Promise.race([testQuery, timeoutPromise])) as any

      if (error) {
        console.log("❌ Database error:", error.message)

        if (error.message.includes("does not exist") || error.message.includes("relation") || error.code === "42P01") {
          console.log("🔧 Tables don't exist, showing setup screen")
          setAppState("needs-setup")
          return
        }

        console.log("🔄 Database connection failed, trying offline mode...")
        const hasOfflineData = loadOfflineData()
        if (hasOfflineData) {
          setAppState("offline-mode")
          return
        }

        setAppState("connection-error")
        return
      }

      console.log("✅ Database connection successful, loading data...")
      await loadData()
      setAppState("ready")
    } catch (err: any) {
      console.error("❌ Error in checkDatabaseSetup:", err)

      const hasOfflineData = loadOfflineData()
      if (hasOfflineData) {
        setAppState("offline-mode")
      } else {
        setAppState("connection-error")
      }
    }
  }

  const loadData = async () => {
    if (!user) {
      console.log("❌ No user found, cannot load data")
      return
    }

    console.log("📊 Loading user data...")

    try {
      const loadWithTimeout = (query: any, name: string, timeout = 6000) => {
        return Promise.race([
          query,
          new Promise((_, reject) => setTimeout(() => reject(new Error(`${name} timeout`)), timeout)),
        ])
      }

      const [bucketsResult, transactionsResult, goalsResult, debtsResult] = await Promise.allSettled([
        loadWithTimeout(
          supabase.from("money_buckets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          "Buckets",
        ),
        loadWithTimeout(
          supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          "Transactions",
        ),
        loadWithTimeout(
          supabase.from("goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          "Goals",
        ),
        loadWithTimeout(
          supabase.from("debts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          "Debts",
        ),
      ])

      const newData = {
        buckets:
          bucketsResult.status === "fulfilled" && !bucketsResult.value.error ? bucketsResult.value.data || [] : [],
        transactions:
          transactionsResult.status === "fulfilled" && !transactionsResult.value.error
            ? transactionsResult.value.data || []
            : [],
        goals: goalsResult.status === "fulfilled" && !goalsResult.value.error ? goalsResult.value.data || [] : [],
        debts: debtsResult.status === "fulfilled" && !debtsResult.value.error ? debtsResult.value.data || [] : [],
      }

      setBuckets(newData.buckets)
      setTransactions(newData.transactions)
      setGoals(newData.goals)
      setDebts(newData.debts)

      saveOfflineData(newData)

      console.log("✅ Data loaded successfully:", {
        buckets: newData.buckets.length,
        transactions: newData.transactions.length,
        goals: newData.goals.length,
        debts: newData.debts.length,
      })
    } catch (err: any) {
      console.error("❌ Error loading data:", err)
      throw err
    }
  }

  const refreshData = async () => {
    if (isReady || isOfflineMode) {
      console.log("🔄 Refreshing data...")
      try {
        await loadData()
        setAppState("ready")
        console.log("✅ Data refreshed successfully")
      } catch (err: any) {
        console.error("❌ Error refreshing data:", err)
      }
    }
  }

  const handleRetry = () => {
    console.log("🔄 Retrying connection...")
    setRetryCount((prev) => prev + 1)
    isInitialized.current = false // ✅ FIX 11: Reset initialization flag
    checkDatabaseSetup()
  }

  const handleSetupComplete = () => {
    console.log("✅ Setup completed, checking database...")
    setAppState("loading")
    checkDatabaseSetup()
  }

  const enterOfflineMode = () => {
    console.log("📱 Entering offline mode...")
    const hasOfflineData = loadOfflineData()
    if (hasOfflineData) {
      setAppState("offline-mode")
    } else {
      setError("No offline data available")
      setAppState("error")
    }
  }

  // Show loading while auth is checking
  if (connectionStatus === "checking") {
    return (
      <div className={`flex items-center justify-center min-h-screen theme-transition ${darkMode ? "dark" : "light"}`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking connection...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-screen theme-transition ${darkMode ? "dark" : "light"}`}>
        <div className="text-center max-w-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            {retryCount > 0 ? `Retrying connection... (${retryCount})` : "Connecting to database..."}
          </p>
          {retryCount > 2 && (
            <Button onClick={enterOfflineMode} variant="outline" className="theme-transition bg-transparent">
              Continue Offline
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (appState === "connection-error") {
    return <ConnectionError onRetry={handleRetry} retryCount={retryCount} onOfflineMode={enterOfflineMode} />
  }

  if (appState === "needs-setup") {
    return <DatabaseSetup onSetupComplete={handleSetupComplete} />
  }

  if (appState === "error") {
    return (
      <div
        className={`flex items-center justify-center min-h-screen p-4 theme-transition ${darkMode ? "dark" : "light"}`}
      >
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold mb-2">Application Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="space-y-2">
            <Button onClick={handleRetry} className="w-full bg-primary hover:bg-primary/90">
              Try Again
            </Button>
            <Button onClick={enterOfflineMode} variant="outline" className="w-full theme-transition bg-transparent">
              Continue Offline
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const renderActiveTab = () => {
    const props = { buckets, transactions, goals, debts, refreshData }

    switch (activeTab) {
      case "dashboard":
        return <Dashboard {...props} />
      case "transactions":
        return <Transactions {...props} />
      case "goals":
        return <Goals {...props} />
      case "owed":
        return <Owed {...props} />
      case "profile":
        return <Profile {...props} />
      default:
        return <Dashboard {...props} />
    }
  }

  return (
    <div className={`flex flex-col h-screen container-fixed theme-transition ${darkMode ? "dark" : "light"}`}>
      {(isOfflineMode || connectionStatus === "disconnected") && (
        <div className="bg-yellow-600 text-black px-4 py-2 text-center text-sm font-medium">
          <div className="flex items-center justify-center space-x-2">
            <WifiOff className="h-4 w-4" />
            <span>Offline Mode - Limited functionality</span>
            <Button
              onClick={handleRetry}
              size="sm"
              variant="ghost"
              className="text-black hover:bg-yellow-700 h-6 px-2 ml-2"
            >
              Reconnect
            </Button>
          </div>
        </div>
      )}

      <div className="scroll-container">{renderActiveTab()}</div>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

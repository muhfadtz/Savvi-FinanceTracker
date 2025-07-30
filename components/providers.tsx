"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { SettingsProvider } from "@/contexts/settings-context"
import type { User } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signOut: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (
    email: string,
    password: string,
    name: string,
    avatar?: string,
  ) => Promise<{ success: boolean; error?: string }>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  connectionStatus: "connected" | "disconnected" | "checking"
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signOut: async () => {},
  signIn: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  resetPassword: async () => ({ success: false }),
  connectionStatus: "checking",
})

export const useAuth = () => useContext(AuthContext)

// ✅ GLOBAL: Prevent multiple auth providers
let authProviderInstance: any = null

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "checking">("checking")

  // ✅ SINGLETON: Only one supabase instance globally
  const supabaseRef = useRef<any>(null)
  if (!supabaseRef.current) {
    supabaseRef.current = createClient()
  }
  const supabase = supabaseRef.current

  // ✅ PREVENT MULTIPLE INSTANCES
  const instanceId = useRef(Math.random().toString(36).substr(2, 9))
  const isActiveInstance = useRef(false)

  // ✅ DEBOUNCE: Prevent rapid state changes
  const lastAuthEvent = useRef<{ event: string; userId: string | null; timestamp: number } | null>(null)
  const authStateTimeout = useRef<NodeJS.Timeout | null>(null)

  // ✅ DEBOUNCED AUTH STATE HANDLER
  const handleAuthStateChange = useCallback(
    (event: string, session: any) => {
      const userId = session?.user?.id || null
      const now = Date.now()

      // Check if this is the same event as before
      if (
        lastAuthEvent.current &&
        lastAuthEvent.current.event === event &&
        lastAuthEvent.current.userId === userId &&
        now - lastAuthEvent.current.timestamp < 1000 // Within 1 second
      ) {
        console.log("🚫 Skipping duplicate auth event:", event, userId)
        return
      }

      // Clear previous timeout
      if (authStateTimeout.current) {
        clearTimeout(authStateTimeout.current)
      }

      // Debounce the actual state update
      authStateTimeout.current = setTimeout(() => {
        if (!isActiveInstance.current) return

        console.log("✅ Processing auth state change:", event, session?.user?.email || "no user")

        try {
          const newUser = session?.user ?? null

          // Only update if user actually changed
          setUser((prevUser) => {
            if (prevUser?.id === newUser?.id) {
              console.log("🔄 User unchanged, skipping update")
              return prevUser
            }
            return newUser
          })

          setError(null)

          if (session?.user) {
            setConnectionStatus("connected")
            localStorage.setItem("savvi-user", JSON.stringify(session.user))
          } else if (event === "SIGNED_OUT") {
            setConnectionStatus("disconnected")
            localStorage.removeItem("savvi-user")
          }

          // Update last event
          lastAuthEvent.current = { event, userId, timestamp: now }
        } catch (err: any) {
          console.error("❌ Auth state change error:", err)
          setError(err.message)
        }
      }, 100) // 100ms debounce
    },
    [isActiveInstance],
  )

  useEffect(() => {
    // ✅ PREVENT MULTIPLE PROVIDERS
    if (authProviderInstance && authProviderInstance !== instanceId.current) {
      console.log("🚫 Another AuthProvider already exists, skipping initialization")
      return
    }

    authProviderInstance = instanceId.current
    isActiveInstance.current = true
    console.log("🔐 AuthProvider initialized with ID:", instanceId.current)

    let mounted = true
    let subscription: any = null

    const initializeAuth = async () => {
      try {
        console.log("🔍 Getting initial session...")
        setConnectionStatus("checking")

        const connectivityTest = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("Connection timeout")), 5000)

          supabase.auth
            .getSession()
            .then((result) => {
              clearTimeout(timeout)
              resolve(result)
            })
            .catch((err) => {
              clearTimeout(timeout)
              reject(err)
            })
        })

        const {
          data: { session },
          error: sessionError,
        } = (await connectivityTest) as any

        if (!mounted || !isActiveInstance.current) return

        if (sessionError) {
          console.error("❌ Session error:", sessionError)

          if (
            sessionError.message?.includes("Failed to fetch") ||
            sessionError.message?.includes("NetworkError") ||
            sessionError.name === "TypeError"
          ) {
            console.log("🌐 Network connectivity issue detected")
            setConnectionStatus("disconnected")
            setError("Network connection failed. Working in offline mode.")

            const savedUser = localStorage.getItem("savvi-user")
            if (savedUser) {
              try {
                const parsedUser = JSON.parse(savedUser)
                setUser(parsedUser)
                console.log("📱 Loaded user from offline storage")
              } catch (e) {
                console.error("❌ Failed to parse saved user:", e)
              }
            }
          } else {
            setError(sessionError.message)
            setConnectionStatus("disconnected")
          }
        } else {
          console.log("✅ Initial session retrieved")
          setConnectionStatus("connected")
          setUser(session?.user ?? null)
          setError(null)

          if (session?.user) {
            localStorage.setItem("savvi-user", JSON.stringify(session.user))
          }
        }
      } catch (err: any) {
        console.error("❌ Auth initialization error:", err)

        if (!mounted || !isActiveInstance.current) return

        setConnectionStatus("disconnected")

        if (err.message?.includes("timeout") || err.message?.includes("Failed to fetch")) {
          setError("Connection timeout. Working in offline mode.")

          const savedUser = localStorage.getItem("savvi-user")
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser)
              setUser(parsedUser)
              console.log("📱 Loaded user from offline storage")
            } catch (e) {
              console.error("❌ Failed to parse saved user:", e)
            }
          }
        } else {
          setError(err.message || "Authentication failed")
        }
      } finally {
        if (mounted && isActiveInstance.current) {
          setLoading(false)
        }
      }
    }

    const setupAuthListener = () => {
      try {
        console.log("🎧 Setting up auth listener for instance:", instanceId.current)

        const {
          data: { subscription: authSubscription },
        } = supabase.auth.onAuthStateChange(handleAuthStateChange)

        subscription = authSubscription
        console.log("✅ Auth listener set up successfully")
      } catch (err: any) {
        console.error("❌ Failed to set up auth listener:", err)
        setError("Failed to initialize authentication listener")
      }
    }

    // Initialize
    initializeAuth()
    setupAuthListener()

    return () => {
      console.log("🧹 Cleaning up AuthProvider:", instanceId.current)
      mounted = false
      isActiveInstance.current = false

      // Clear timeout
      if (authStateTimeout.current) {
        clearTimeout(authStateTimeout.current)
      }

      // Unsubscribe
      if (subscription) {
        subscription.unsubscribe()
      }

      // Reset global instance if this was the active one
      if (authProviderInstance === instanceId.current) {
        authProviderInstance = null
      }
    }
  }, [handleAuthStateChange])

  const signIn = async (email: string, password: string) => {
    console.log("🔑 Sign in attempt for:", email)
    setLoading(true)
    setError(null)

    try {
      const signInPromise = supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Sign in timeout")), 10000))

      const { data, error } = (await Promise.race([signInPromise, timeoutPromise])) as any

      if (error) {
        console.error("❌ Sign in error:", error)
        setError(error.message)
        setConnectionStatus("disconnected")
        return { success: false, error: error.message }
      }

      if (data.user) {
        console.log("✅ Sign in successful:", data.user.email)
        setUser(data.user)
        setConnectionStatus("connected")
        localStorage.setItem("savvi-user", JSON.stringify(data.user))
        return { success: true }
      }

      return { success: false, error: "Login failed" }
    } catch (err: any) {
      console.error("❌ Sign in exception:", err)
      const errorMessage = err.message || "An unexpected error occurred"
      setError(errorMessage)
      setConnectionStatus("disconnected")
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string, avatar = "🥕") => {
    console.log("📝 Sign up attempt for:", email, "with avatar:", avatar)
    setLoading(true)
    setError(null)

    try {
      const signUpPromise = supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
            avatar: avatar,
          },
        },
      })

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Sign up timeout")), 10000))

      const { data, error } = (await Promise.race([signUpPromise, timeoutPromise])) as any

      if (error) {
        console.error("❌ Sign up error:", error)
        setError(error.message)
        setConnectionStatus("disconnected")
        return { success: false, error: error.message }
      }

      if (data.user) {
        console.log("✅ Sign up successful:", data.user.email)
        if (!data.session) {
          return {
            success: true,
            error: "Please check your email for verification link before signing in.",
          }
        }
        setUser(data.user)
        setConnectionStatus("connected")
        localStorage.setItem("savvi-user", JSON.stringify(data.user))
        return { success: true }
      }

      return { success: false, error: "Registration failed" }
    } catch (err: any) {
      console.error("❌ Sign up exception:", err)
      const errorMessage = err.message || "An unexpected error occurred"
      setError(errorMessage)
      setConnectionStatus("disconnected")
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    console.log("🔄 Password reset attempt for:", email)
    setLoading(true)
    setError(null)

    try {
      const resetPromise = supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Reset password timeout")), 10000),
      )

      const { error } = (await Promise.race([resetPromise, timeoutPromise])) as any

      if (error) {
        console.error("❌ Password reset error:", error)
        setError(error.message)
        setConnectionStatus("disconnected")
        return { success: false, error: error.message }
      }

      console.log("✅ Password reset email sent")
      setConnectionStatus("connected")
      return { success: true }
    } catch (err: any) {
      console.error("❌ Password reset exception:", err)
      const errorMessage = err.message || "Password reset failed"
      setError(errorMessage)
      setConnectionStatus("disconnected")
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    console.log("🚪 Sign out attempt")
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("❌ Sign out error:", error)
        setError(error.message)
      } else {
        console.log("✅ Sign out successful")
        setUser(null)
        setError(null)
        localStorage.removeItem("savvi-user")
      }
    } catch (err: any) {
      console.error("❌ Sign out exception:", err)
      setError(err.message)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signOut,
        signIn,
        signUp,
        resetPassword,
        connectionStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <AuthProvider>{children}</AuthProvider>
    </SettingsProvider>
  )
}

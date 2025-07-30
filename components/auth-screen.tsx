"use client"

import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Mail, Lock, User, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { useSettings } from "@/contexts/settings-context"
import { useAuth } from "@/components/providers"

const vegetableAvatars = ["🥕", "🥬", "🥒", "🍅", "🥔", "🧄", "🧅", "🌶️", "🥦", "🌽", "🍆", "🥑", "🫑", "🥜", "🫘", "🥗"]

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [selectedAvatar, setSelectedAvatar] = useState("🥕")
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("error")

  const { t } = useSettings()
  const { signIn, signUp, resetPassword, loading, error } = useAuth()

  const showMessage = (msg: string, type: "success" | "error" | "info" = "error") => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(""), 8000)
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")

    console.log("🔐 Testing auth function:", mode)

    // Basic validation
    if (!email.trim()) {
      showMessage("Email is required", "error")
      return
    }

    if (!email.includes("@")) {
      showMessage("Please enter a valid email address", "error")
      return
    }

    if (mode !== "forgot" && !password) {
      showMessage("Password is required", "error")
      return
    }

    if (mode !== "forgot" && password.length < 6) {
      showMessage("Password must be at least 6 characters", "error")
      return
    }

    if (mode === "register" && !name.trim()) {
      showMessage("Name is required", "error")
      return
    }

    try {
      if (mode === "login") {
        console.log("🔑 Testing sign in...")
        const result = await signIn(email, password)
        console.log("✅ Sign in result:", result)
        if (!result.success) {
          showMessage(result.error || "Login failed", "error")
        }
      } else if (mode === "register") {
        console.log("📝 Testing sign up...")
        const result = await signUp(email, password, name, selectedAvatar)
        console.log("✅ Sign up result:", result)
        if (result.success) {
          if (result.error) {
            showMessage(result.error, "info")
          } else {
            showMessage("Account created successfully!", "success")
          }
        } else {
          showMessage(result.error || "Registration failed", "error")
        }
      } else if (mode === "forgot") {
        console.log("🔄 Testing password reset...")
        const result = await resetPassword(email)
        console.log("✅ Password reset result:", result)
        if (result.success) {
          showMessage("Password reset email sent! Check your inbox.", "success")
        } else {
          showMessage(result.error || "Password reset failed", "error")
        }
      }
    } catch (error: any) {
      console.error("❌ Auth error:", error)
      showMessage(error.message || "An unexpected error occurred", "error")
    }
  }

  const resetForm = () => {
    setEmail("")
    setPassword("")
    setName("")
    setSelectedAvatar("🥕")
    setMessage("")
    setShowPassword(false)
  }

  const switchMode = (newMode: "login" | "register" | "forgot") => {
    setMode(newMode)
    resetForm()
  }

  // Show auth error from context
  React.useEffect(() => {
    if (error) {
      showMessage(error, "error")
    }
  }, [error])

  const getMessageIcon = () => {
    switch (messageType) {
      case "success":
        return <CheckCircle className="h-4 w-4" />
      case "info":
        return <Mail className="h-4 w-4" />
      case "error":
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getMessageStyles = () => {
    switch (messageType) {
      case "success":
        return { backgroundColor: "rgba(29, 185, 84, 0.1)", color: "#1DB954", borderColor: "rgba(29, 185, 84, 0.2)" }
      case "info":
        return { backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", borderColor: "rgba(59, 130, 246, 0.2)" }
      case "error":
      default:
        return { backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.2)" }
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4" style={{ backgroundColor: "#191414" }}>
      <Card
        className="w-full max-w-sm border theme-transition"
        style={{ backgroundColor: "#121212", borderColor: "#535353" }}
      >
        <CardHeader className="text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#1DB954" }}
          >
            <span className="text-2xl font-bold text-black">$</span>
          </div>
          <CardTitle className="text-2xl" style={{ color: "#FFFFFF" }}>
            savviFinance
          </CardTitle>
          <CardDescription style={{ color: "#B3B3B3" }}>
            {mode === "login" && "Welcome back! Sign in to continue"}
            {mode === "register" && "Create your account to get started"}
            {mode === "forgot" && "Reset your password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {mode === "register" && (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4" style={{ color: "#B3B3B3" }} />
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 15))}
                    className="pl-10 border theme-transition"
                    style={{
                      backgroundColor: "#191414",
                      borderColor: "#535353",
                      color: "#FFFFFF",
                    }}
                    required
                    disabled={loading}
                    maxLength={15}
                  />
                  <div className="text-xs mt-1" style={{ color: "#B3B3B3" }}>
                    {name.length}/15 characters
                  </div>
                </div>

                {/* Enhanced Avatar Picker */}
                <div className="space-y-3">
                  <label className="text-sm" style={{ color: "#B3B3B3" }}>
                    Choose your avatar:
                  </label>
                  <div className="flex items-center justify-center">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                      style={{ backgroundColor: "#1DB954" }}
                    >
                      {selectedAvatar}
                    </div>
                  </div>
                  <div
                    className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto p-2 rounded-lg border theme-transition"
                    style={{ backgroundColor: "#191414", borderColor: "#535353" }}
                  >
                    {vegetableAvatars.map((avatar) => (
                      <button
                        key={avatar}
                        type="button"
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all hover:scale-110 theme-transition ${
                          selectedAvatar === avatar ? "scale-110 ring-2 ring-offset-2" : "hover:opacity-80"
                        }`}
                        style={{
                          backgroundColor: selectedAvatar === avatar ? "#1DB954" : "#121212",
                          ringColor: selectedAvatar === avatar ? "#1DB954" : "transparent",
                          ringOffsetColor: "#191414",
                        }}
                        disabled={loading}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-center" style={{ color: "#B3B3B3" }}>
                    Selected: {selectedAvatar} • {vegetableAvatars.length} options available
                  </div>
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4" style={{ color: "#B3B3B3" }} />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 border theme-transition"
                style={{
                  backgroundColor: "#191414",
                  borderColor: "#535353",
                  color: "#FFFFFF",
                }}
                required
                disabled={loading}
              />
            </div>

            {mode !== "forgot" && (
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4" style={{ color: "#B3B3B3" }} />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 border theme-transition"
                  style={{
                    backgroundColor: "#191414",
                    borderColor: "#535353",
                    color: "#FFFFFF",
                  }}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 hover:opacity-80 disabled:opacity-50 theme-transition"
                  style={{ color: "#B3B3B3" }}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full font-semibold disabled:opacity-50"
              style={{ backgroundColor: "#1DB954", color: "#000000" }}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : mode === "login" ? (
                "Sign In"
              ) : mode === "register" ? (
                "Create Account"
              ) : (
                "Send Reset Email"
              )}
            </Button>

            {message && (
              <div className="p-3 rounded-lg text-sm border" style={getMessageStyles()}>
                <div className="flex items-center space-x-2">
                  {getMessageIcon()}
                  <span>{message}</span>
                </div>
              </div>
            )}

            <div className="text-center space-y-2">
              {mode === "login" && (
                <>
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="text-sm hover:opacity-80 disabled:opacity-50 theme-transition"
                    style={{ color: "#B3B3B3" }}
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                  <div>
                    <span className="text-sm" style={{ color: "#B3B3B3" }}>
                      Don't have an account?{" "}
                    </span>
                    <button
                      type="button"
                      onClick={() => switchMode("register")}
                      className="text-sm hover:underline disabled:opacity-50"
                      style={{ color: "#1DB954" }}
                      disabled={loading}
                    >
                      Sign up
                    </button>
                  </div>
                </>
              )}

              {mode === "register" && (
                <div>
                  <span className="text-sm" style={{ color: "#B3B3B3" }}>
                    Already have an account?{" "}
                  </span>
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="text-sm hover:underline disabled:opacity-50"
                    style={{ color: "#1DB954" }}
                    disabled={loading}
                  >
                    Sign in
                  </button>
                </div>
              )}

              {mode === "forgot" && (
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-sm hover:underline disabled:opacity-50"
                  style={{ color: "#1DB954" }}
                  disabled={loading}
                >
                  Back to sign in
                </button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

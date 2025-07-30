"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WifiOff, RefreshCw, AlertTriangle, CheckCircle, XCircle, Wifi } from "lucide-react"

interface ConnectionErrorProps {
  onRetry: () => void
  retryCount: number
  onOfflineMode?: () => void
}

export function ConnectionError({ onRetry, retryCount, onOfflineMode }: ConnectionErrorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [envCheck, setEnvCheck] = useState<{
    hasUrl: boolean
    hasKey: boolean
    urlValid: boolean
  } | null>(null)

  useEffect(() => {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    setEnvCheck({
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlValid: supabaseUrl ? supabaseUrl.includes("supabase") : false,
    })

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const getDiagnosticInfo = () => {
    const issues = []

    if (!isOnline) {
      issues.push("❌ No internet connection")
    } else {
      issues.push("✅ Internet connection active")
    }

    if (!envCheck?.hasUrl) {
      issues.push("❌ NEXT_PUBLIC_SUPABASE_URL not set")
    } else if (!envCheck?.urlValid) {
      issues.push("❌ NEXT_PUBLIC_SUPABASE_URL appears invalid")
    } else {
      issues.push("✅ Supabase URL configured")
    }

    if (!envCheck?.hasKey) {
      issues.push("❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not set")
    } else {
      issues.push("✅ Supabase key configured")
    }

    if (retryCount > 0) {
      issues.push(`⚠️ Connection attempts: ${retryCount}`)
    }

    return issues
  }

  const getRecommendations = () => {
    const recommendations = []

    if (!isOnline) {
      recommendations.push("Check your internet connection")
      recommendations.push("Try connecting to a different network")
    }

    if (!envCheck?.hasUrl || !envCheck?.hasKey) {
      recommendations.push("Set up your environment variables in .env.local")
      recommendations.push("Restart your development server after adding env vars")
    }

    if (envCheck?.hasUrl && !envCheck?.urlValid) {
      recommendations.push("Verify your Supabase URL is correct")
    }

    if (retryCount > 2) {
      recommendations.push("Try using offline mode to continue working")
      recommendations.push("Check if Supabase is experiencing downtime")
    }

    if (isOnline && envCheck?.hasUrl && envCheck?.hasKey) {
      recommendations.push("The connection is timing out - try offline mode")
      recommendations.push("Your Supabase project might be paused or inactive")
    }

    return recommendations
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-[#191414]">
      <Card className="w-full max-w-lg bg-[#121212] border-[#535353]">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiOff className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Connection Timeout</CardTitle>
          <p className="text-[#B3B3B3]">
            {retryCount > 2
              ? "Multiple connection attempts failed. You can continue in offline mode."
              : "Unable to connect to the database. Let's diagnose the issue."}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Diagnostic Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
              Connection Status
            </h3>
            <div className="bg-[#191414] rounded-lg p-4 border border-[#535353]">
              {getDiagnosticInfo().map((info, index) => (
                <div key={index} className="text-sm text-[#B3B3B3] mb-1 font-mono">
                  {info}
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Recommended Actions</h3>
            <div className="space-y-2">
              {getRecommendations().map((rec, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-[#1DB954] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-[#B3B3B3]">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Environment Variables Help */}
          {(!envCheck?.hasUrl || !envCheck?.hasKey) && (
            <div className="bg-[#191414] rounded-lg p-4 border border-[#535353]">
              <h4 className="text-white font-medium mb-2">Missing Environment Variables</h4>
              <p className="text-sm text-[#B3B3B3] mb-3">
                Create a <code className="bg-black px-1 rounded">.env.local</code> file in your project root:
              </p>
              <div className="bg-black rounded p-3">
                <pre className="text-xs text-[#1DB954]">
                  {`NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`}
                </pre>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button onClick={onRetry} className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection {retryCount > 0 && `(${retryCount})`}
            </Button>

            {onOfflineMode && retryCount > 1 && (
              <Button
                onClick={onOfflineMode}
                variant="outline"
                className="w-full border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black bg-transparent"
              >
                <Wifi className="h-4 w-4 mr-2" />
                Continue in Offline Mode
              </Button>
            )}

            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full border-[#535353] text-[#B3B3B3] hover:text-white bg-transparent"
            >
              Refresh Page
            </Button>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-[#B3B3B3]">{isOnline ? "Online" : "Offline"}</span>
            </div>
            <div className="flex items-center space-x-2">
              {envCheck?.hasUrl && envCheck?.hasKey ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-[#B3B3B3]">
                {envCheck?.hasUrl && envCheck?.hasKey ? "Config OK" : "Config Missing"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

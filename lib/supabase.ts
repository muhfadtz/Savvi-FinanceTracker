import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL is not set in environment variables")
}

if (!supabaseAnonKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in environment variables")
}

export const createClient = () => {
  const url = supabaseUrl || "https://placeholder.supabase.co"
  const key = supabaseAnonKey || "placeholder-key"

  try {
    return createSupabaseClient(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          "X-Client-Info": "savvi-finance-app",
        },
      },
      db: {
        schema: "public",
      },
      realtime: {
        params: {
          eventsPerSecond: 2,
        },
      },
    })
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    throw new Error("Supabase client initialization failed. Please check your configuration.")
  }
}

export const getSupabaseConfig = () => ({
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlValid: supabaseUrl ? supabaseUrl.includes("supabase") : false,
  url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : "Not set",
})

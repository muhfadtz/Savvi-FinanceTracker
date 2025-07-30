"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Settings, Wallet, LogOut, Edit, Plus, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/components/providers"
import { useSettings, currencyConfig, type Language, type Currency } from "@/contexts/settings-context"
import type { MoneyBucket, Transaction, Goal, Debt } from "@/components/main-app"
import { AvatarPicker } from "@/components/avatar-picker"
import { ThemeToggle } from "@/components/theme-toggle"

interface ProfileProps {
  buckets: MoneyBucket[]
  transactions: Transaction[]
  goals: Goal[]
  debts: Debt[]
  refreshData: () => void
}

export function Profile({ buckets, transactions, goals, debts, refreshData }: ProfileProps) {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isBucketDialogOpen, setIsBucketDialogOpen] = useState(false)
  const [editingBucket, setEditingBucket] = useState<MoneyBucket | null>(null)
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    avatar: "🥕",
  })
  const [bucketData, setBucketData] = useState({
    name: "",
    balance: "",
  })
  const [loading, setLoading] = useState(false)

  const { user, signOut } = useAuth()
  const { language, currency, darkMode, setLanguage, setCurrency, setDarkMode, t, formatCurrency } = useSettings()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.user_metadata?.name || "",
        email: user.email || "",
        avatar: user.user_metadata?.avatar || "🥕",
      })
    }
  }, [user])

  const totalBalance = buckets.reduce((sum, bucket) => sum + bucket.balance, 0)
  const totalGoalProgress = goals.reduce((sum, goal) => sum + goal.current_amount, 0)
  const totalDebt = debts.filter((d) => d.type === "owed_by_me" && !d.paid).reduce((sum, d) => sum + d.amount, 0)
  const totalReceivable = debts.filter((d) => d.type === "owed_to_me" && !d.paid).reduce((sum, d) => sum + d.amount, 0)

  const handleAvatarChange = async (newAvatar: string) => {
    if (!user) return

    console.log("🥕 Changing avatar to:", newAvatar)
    setLoading(true)

    try {
      setProfileData((prev) => ({ ...prev, avatar: newAvatar }))

      const { error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          avatar: newAvatar,
        },
      })

      if (error) {
        console.error("❌ Avatar update error:", error)
        setProfileData((prev) => ({ ...prev, avatar: user.user_metadata?.avatar || "🥕" }))
        throw error
      }

      console.log("✅ Avatar updated successfully")

      const {
        data: { user: updatedUser },
      } = await supabase.auth.getUser()
      if (updatedUser) {
        console.log("🔄 User data refreshed with new avatar")
      }
    } catch (error) {
      console.error("❌ Error updating avatar:", error)
      alert("Failed to update avatar. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    console.log("📝 Updating profile:", profileData)
    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          name: profileData.name,
          avatar: profileData.avatar,
        },
      })

      if (error) {
        console.error("❌ Profile update error:", error)
        throw error
      }

      console.log("✅ Profile updated successfully")
      setIsEditProfileOpen(false)
      alert("Profile updated successfully!")
    } catch (error) {
      console.error("❌ Error updating profile:", error)
      alert("Failed to update profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleBucketSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const bucketInfo = {
        name: bucketData.name,
        balance: Number.parseFloat(bucketData.balance),
        user_id: user.id,
      }

      if (editingBucket) {
        await supabase.from("money_buckets").update(bucketInfo).eq("id", editingBucket.id)
      } else {
        await supabase.from("money_buckets").insert([bucketInfo])
      }

      setBucketData({ name: "", balance: "" })
      setIsBucketDialogOpen(false)
      setEditingBucket(null)
      refreshData()
    } catch (error) {
      console.error("Error saving bucket:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBucket = async (bucket: MoneyBucket) => {
    if (!confirm(t("confirm_delete"))) return

    try {
      await supabase.from("money_buckets").delete().eq("id", bucket.id)
      refreshData()
    } catch (error) {
      console.error("Error deleting bucket:", error)
    }
  }

  const startEditBucket = (bucket: MoneyBucket) => {
    setEditingBucket(bucket)
    setBucketData({
      name: bucket.name,
      balance: bucket.balance.toString(),
    })
    setIsBucketDialogOpen(true)
  }

  const handleSignOut = async () => {
    if (confirm(t("confirm_signout"))) {
      console.log("🚪 Testing sign out...")
      await signOut()
    }
  }

  return (
    <div className="p-4 space-y-6 theme-transition" style={{ backgroundColor: "#191414", color: "#FFFFFF" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#FFFFFF" }}>
            {t("profile")}
          </h1>
          <p style={{ color: "#B3B3B3" }}>{t("manage_account")}</p>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="theme-transition" style={{ backgroundColor: "#121212", borderColor: "#535353" }}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <AvatarPicker
                currentAvatar={profileData.avatar}
                onAvatarChange={handleAvatarChange}
                loading={loading}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold truncate" style={{ color: "#FFFFFF" }}>
                  {profileData.name || "User"}
                </h2>
                <p className="truncate" style={{ color: "#B3B3B3" }}>
                  {profileData.email}
                </p>
              </div>
            </div>
            <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="flex-shrink-0" style={{ color: "#B3B3B3" }}>
                  <Edit className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent
                className="theme-transition"
                style={{ backgroundColor: "#121212", borderColor: "#535353", color: "#FFFFFF" }}
              >
                <DialogHeader>
                  <DialogTitle style={{ color: "#FFFFFF" }}>{t("edit_profile")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <label className="text-sm mb-2 block" style={{ color: "#B3B3B3" }}>
                      {t("name")}
                    </label>
                    <Input
                      value={profileData.name}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value.slice(0, 15) }))}
                      className="theme-transition"
                      style={{ backgroundColor: "#191414", borderColor: "#535353", color: "#FFFFFF" }}
                      required
                      maxLength={15}
                    />
                    <div className="text-xs mt-1" style={{ color: "#B3B3B3" }}>
                      {profileData.name.length}/15 characters
                    </div>
                  </div>
                  <div>
                    <label className="text-sm mb-2 block" style={{ color: "#B3B3B3" }}>
                      {t("email")}
                    </label>
                    <Input
                      value={profileData.email}
                      disabled
                      className="theme-transition opacity-50"
                      style={{ backgroundColor: "#191414", borderColor: "#535353", color: "#B3B3B3" }}
                    />
                    <p className="text-xs mt-1" style={{ color: "#B3B3B3" }}>
                      {t("email_cannot_change")}
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditProfileOpen(false)}
                      className="flex-1 theme-transition"
                      style={{ borderColor: "#535353", color: "#B3B3B3", backgroundColor: "transparent" }}
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1"
                      style={{ backgroundColor: "#1DB954", color: "#000000" }}
                    >
                      {loading ? t("saving") : t("save_changes")}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card className="theme-transition" style={{ backgroundColor: "#121212", borderColor: "#535353" }}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2" style={{ color: "#FFFFFF" }}>
            <Wallet className="h-5 w-5" style={{ color: "#1DB954" }} />
            <span>{t("financial_overview")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg theme-transition" style={{ backgroundColor: "#191414" }}>
              <p className="text-sm truncate" style={{ color: "#B3B3B3" }}>
                {t("total_balance")}
              </p>
              <p className="text-2xl font-bold truncate" style={{ color: "#1DB954" }}>
                {formatCurrency(totalBalance)}
              </p>
            </div>
            <div className="p-4 rounded-lg theme-transition" style={{ backgroundColor: "#191414" }}>
              <p className="text-sm truncate" style={{ color: "#B3B3B3" }}>
                {t("goals_progress")}
              </p>
              <p className="text-2xl font-bold truncate" style={{ color: "#1DB954" }}>
                {formatCurrency(totalGoalProgress)}
              </p>
            </div>
            <div className="p-4 rounded-lg theme-transition" style={{ backgroundColor: "#191414" }}>
              <p className="text-sm truncate" style={{ color: "#B3B3B3" }}>
                {t("total_debt")}
              </p>
              <p className="text-2xl font-bold text-red-400 truncate">{formatCurrency(totalDebt)}</p>
            </div>
            <div className="p-4 rounded-lg theme-transition" style={{ backgroundColor: "#191414" }}>
              <p className="text-sm truncate" style={{ color: "#B3B3B3" }}>
                {t("receivables")}
              </p>
              <p className="text-2xl font-bold truncate" style={{ color: "#1DB954" }}>
                {formatCurrency(totalReceivable)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Money Buckets Management */}
      <Card className="theme-transition" style={{ backgroundColor: "#121212", borderColor: "#535353" }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2" style={{ color: "#FFFFFF" }}>
              <Wallet className="h-5 w-5" style={{ color: "#1DB954" }} />
              <span>{t("money_buckets")}</span>
            </CardTitle>
            <Dialog open={isBucketDialogOpen} onOpenChange={setIsBucketDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="hover:opacity-90"
                  style={{ backgroundColor: "#1DB954", color: "#000000" }}
                  onClick={() => {
                    setBucketData({ name: "", balance: "" })
                    setEditingBucket(null)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("add_bucket")}
                </Button>
              </DialogTrigger>
              <DialogContent
                className="theme-transition"
                style={{ backgroundColor: "#121212", borderColor: "#535353", color: "#FFFFFF" }}
              >
                <DialogHeader>
                  <DialogTitle style={{ color: "#FFFFFF" }}>
                    {editingBucket ? t("edit_bucket") : t("add_new_bucket")}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleBucketSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm mb-2 block" style={{ color: "#B3B3B3" }}>
                      {t("bucket_name")}
                    </label>
                    <Input
                      value={bucketData.name}
                      onChange={(e) => setBucketData((prev) => ({ ...prev, name: e.target.value }))}
                      className="theme-transition"
                      style={{ backgroundColor: "#191414", borderColor: "#535353", color: "#FFFFFF" }}
                      placeholder="e.g., Wallet, Bank Account, PayPal"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm mb-2 block" style={{ color: "#B3B3B3" }}>
                      {t("initial_balance")}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={bucketData.balance}
                      onChange={(e) => setBucketData((prev) => ({ ...prev, balance: e.target.value }))}
                      className="theme-transition"
                      style={{ backgroundColor: "#191414", borderColor: "#535353", color: "#FFFFFF" }}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsBucketDialogOpen(false)
                        setEditingBucket(null)
                      }}
                      className="flex-1 theme-transition"
                      style={{ borderColor: "#535353", color: "#B3B3B3", backgroundColor: "transparent" }}
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1"
                      style={{ backgroundColor: "#1DB954", color: "#000000" }}
                    >
                      {loading ? t("saving") : editingBucket ? t("update") : t("add_bucket")}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {buckets.map((bucket) => (
              <div
                key={bucket.id}
                className="flex items-center justify-between p-3 rounded-lg theme-transition"
                style={{ backgroundColor: "#191414" }}
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#1DB954" }}
                  >
                    <Wallet className="h-5 w-5 text-black" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate" style={{ color: "#FFFFFF" }}>
                      {bucket.name}
                    </p>
                    <p className="font-semibold truncate" style={{ color: "#1DB954" }}>
                      {formatCurrency(bucket.balance)}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEditBucket(bucket)}
                    className="h-8 w-8"
                    style={{ color: "#B3B3B3" }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteBucket(bucket)}
                    className="h-8 w-8 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {buckets.length === 0 && (
              <p className="text-center py-4" style={{ color: "#B3B3B3" }}>
                {t("no_buckets_yet")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="theme-transition" style={{ backgroundColor: "#121212", borderColor: "#535353" }}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2" style={{ color: "#FFFFFF" }}>
            <Settings className="h-5 w-5" style={{ color: "#1DB954" }} />
            <span>{t("settings")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ThemeToggle />

          <div className="space-y-2">
            <label className="font-medium" style={{ color: "#FFFFFF" }}>
              {t("language")}
            </label>
            <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
              <SelectTrigger
                className="theme-transition"
                style={{ backgroundColor: "#191414", borderColor: "#535353", color: "#FFFFFF" }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                className="theme-transition"
                style={{ backgroundColor: "#121212", borderColor: "#535353" }}
              >
                <SelectItem value="en">🇺🇸 English</SelectItem>
                <SelectItem value="id">🇮🇩 Bahasa Indonesia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="font-medium" style={{ color: "#FFFFFF" }}>
              {t("currency")}
            </label>
            <Select value={currency} onValueChange={(value: Currency) => setCurrency(value)}>
              <SelectTrigger
                className="theme-transition"
                style={{ backgroundColor: "#191414", borderColor: "#535353", color: "#FFFFFF" }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                className="theme-transition"
                style={{ backgroundColor: "#121212", borderColor: "#535353" }}
              >
                {Object.entries(currencyConfig).map(([code, config]) => (
                  <SelectItem key={code} value={code}>
                    {config.symbol} {config.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card className="theme-transition" style={{ backgroundColor: "#121212", borderColor: "#535353" }}>
        <CardContent className="p-6">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full border-red-500 text-red-400 hover:bg-red-500 hover:text-white theme-transition bg-transparent"
            style={{ backgroundColor: "transparent" }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t("sign_out")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

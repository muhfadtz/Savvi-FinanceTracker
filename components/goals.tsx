"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Plus, Target, Edit, Trash2, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/components/providers"
import { useSettings } from "@/contexts/settings-context"
import type { Goal } from "@/components/main-app"

interface GoalsProps {
  goals: Goal[]
  refreshData: () => void
}

export function Goals({ goals, refreshData }: GoalsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    target_amount: "",
  })
  const [loading, setLoading] = useState(false)

  const { user } = useAuth()
  const { t, formatCurrency } = useSettings()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const goalData = {
        title: formData.title,
        target_amount: Number.parseFloat(formData.target_amount),
        current_amount: editingGoal?.current_amount || 0,
        completed: false,
        user_id: user.id,
      }

      if (editingGoal) {
        await supabase.from("goals").update(goalData).eq("id", editingGoal.id)
      } else {
        await supabase.from("goals").insert([goalData])
      }

      resetForm()
      setIsAddDialogOpen(false)
      setEditingGoal(null)
      refreshData()
    } catch (error) {
      console.error("Error saving goal:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (goal: Goal) => {
    if (!confirm(t("confirm_delete"))) return

    try {
      await supabase.from("goals").delete().eq("id", goal.id)
      refreshData()
    } catch (error) {
      console.error("Error deleting goal:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      target_amount: "",
    })
  }

  const startEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setFormData({
      title: goal.title,
      target_amount: goal.target_amount.toString(),
    })
    setIsAddDialogOpen(true)
  }

  const activeGoals = goals.filter((g) => !g.completed)
  const completedGoals = goals.filter((g) => g.completed)

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("financial_goals")}</h1>
          <p className="text-[#B3B3B3]">{t("track_savings_targets")}</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-[#1DB954] hover:bg-[#1ed760] text-black"
              onClick={() => {
                resetForm()
                setEditingGoal(null)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("add_goal")}
            </Button>
          </DialogTrigger>
          <DialogContent
            className="bg-[#121212] border-[#535353] text-white"
            aria-describedby="goal-dialog-description"
          >
            <DialogHeader>
              <DialogTitle>{editingGoal ? t("edit_goal") : t("create_new_goal")}</DialogTitle>
              <div id="goal-dialog-description" className="sr-only">
                {editingGoal ? "Edit existing financial goal" : "Create new savings target"}
              </div>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-[#B3B3B3] mb-2 block">{t("goal_title")}</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="bg-[#191414] border-[#535353]"
                  placeholder="e.g., Emergency Fund, New Laptop"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-[#B3B3B3] mb-2 block">{t("target_amount")}</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.target_amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, target_amount: e.target.value }))}
                  className="bg-[#191414] border-[#535353]"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setEditingGoal(null)
                    resetForm()
                  }}
                  className="flex-1 border-[#535353] text-[#B3B3B3] hover:text-white"
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 bg-[#1DB954] hover:bg-[#1ed760] text-black">
                  {loading ? t("saving") : editingGoal ? t("update_goal") : t("create_goal")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Goals */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">{t("active_goals")}</h2>
        {activeGoals.length === 0 ? (
          <Card className="bg-[#121212] border-[#535353]">
            <CardContent className="p-8 text-center">
              <Target className="h-12 w-12 text-[#535353] mx-auto mb-4" />
              <p className="text-[#B3B3B3]">{t("no_active_goals")}</p>
              <p className="text-sm text-[#535353] mt-2">{t("create_first_goal")}</p>
            </CardContent>
          </Card>
        ) : (
          activeGoals.map((goal) => {
            const progress = (goal.current_amount / goal.target_amount) * 100

            return (
              <Card key={goal.id} className="bg-[#121212] border-[#535353]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center flex-shrink-0">
                        <Target className="h-6 w-6 text-black" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-white truncate">{goal.title}</h3>
                        <p className="text-[#B3B3B3] text-sm truncate">
                          {formatCurrency(goal.current_amount)} of {formatCurrency(goal.target_amount)}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(goal)}
                        className="h-8 w-8 text-[#B3B3B3] hover:text-[#1DB954]"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(goal)}
                        className="h-8 w-8 text-[#B3B3B3] hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#B3B3B3]">{t("progress")}</span>
                      <span className="text-[#1DB954] font-medium">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-[#191414]" />
                    <div className="flex justify-between text-sm text-[#B3B3B3]">
                      <span>
                        {formatCurrency(goal.target_amount - goal.current_amount)} {t("remaining")}
                      </span>
                      <span>
                        {t("target")}: {formatCurrency(goal.target_amount)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">{t("completed_goals")}</h2>
          {completedGoals.map((goal) => (
            <Card key={goal.id} className="bg-[#121212] border-[#1DB954]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-black" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-white truncate">{goal.title}</h3>
                      <p className="text-[#1DB954] text-sm font-medium truncate">
                        {t("goal_completed")} {formatCurrency(goal.target_amount)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(goal)}
                    className="h-8 w-8 text-[#B3B3B3] hover:text-red-400 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

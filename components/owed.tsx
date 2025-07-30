"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Users, ArrowUp, ArrowDown, Edit, Trash2, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/components/providers"
import { useSettings } from "@/contexts/settings-context"
import type { Debt } from "@/components/main-app"

interface OwedProps {
  debts: Debt[]
  refreshData: () => void
}

export function Owed({ debts, refreshData }: OwedProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)
  const [formData, setFormData] = useState({
    amount: "",
    person_name: "",
    due_date: "",
    type: "owed_by_me" as "owed_by_me" | "owed_to_me",
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
      const debtData = {
        amount: Number.parseFloat(formData.amount),
        person_name: formData.person_name,
        due_date: formData.due_date || null,
        type: formData.type,
        paid: false,
        user_id: user.id,
      }

      if (editingDebt) {
        await supabase.from("debts").update(debtData).eq("id", editingDebt.id)
      } else {
        await supabase.from("debts").insert([debtData])
      }

      resetForm()
      setIsAddDialogOpen(false)
      setEditingDebt(null)
      refreshData()
    } catch (error) {
      console.error("Error saving debt:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async (debt: Debt) => {
    try {
      await supabase.from("debts").update({ paid: !debt.paid }).eq("id", debt.id)
      refreshData()
    } catch (error) {
      console.error("Error updating debt status:", error)
    }
  }

  const handleDelete = async (debt: Debt) => {
    if (!confirm(t("confirm_delete"))) return

    try {
      await supabase.from("debts").delete().eq("id", debt.id)
      refreshData()
    } catch (error) {
      console.error("Error deleting debt:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      amount: "",
      person_name: "",
      due_date: "",
      type: "owed_by_me",
    })
  }

  const startEdit = (debt: Debt) => {
    setEditingDebt(debt)
    setFormData({
      amount: debt.amount.toString(),
      person_name: debt.person_name,
      due_date: debt.due_date || "",
      type: debt.type,
    })
    setIsAddDialogOpen(true)
  }

  const owedByMe = debts.filter((d) => d.type === "owed_by_me")
  const owedToMe = debts.filter((d) => d.type === "owed_to_me")

  const totalOwedByMe = owedByMe.filter((d) => !d.paid).reduce((sum, d) => sum + d.amount, 0)
  const totalOwedToMe = owedToMe.filter((d) => !d.paid).reduce((sum, d) => sum + d.amount, 0)

  const DebtCard = ({ debt }: { debt: Debt }) => {
    const isOverdue = debt.due_date && new Date(debt.due_date) < new Date() && !debt.paid

    return (
      <Card className={`bg-[#121212] border-[#535353] ${isOverdue ? "border-red-500" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  debt.type === "owed_by_me" ? "bg-red-500" : "bg-[#1DB954]"
                }`}
              >
                {debt.type === "owed_by_me" ? (
                  <ArrowUp className="h-6 w-6 text-white" />
                ) : (
                  <ArrowDown className="h-6 w-6 text-black" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-medium truncate">{debt.person_name}</p>
                <p
                  className={`text-lg font-semibold truncate ${debt.type === "owed_by_me" ? "text-red-400" : "text-[#1DB954]"}`}
                >
                  {formatCurrency(debt.amount)}
                </p>
                {debt.due_date && (
                  <p className={`text-sm truncate ${isOverdue ? "text-red-400" : "text-[#B3B3B3]"}`}>
                    {t("due")}: {new Date(debt.due_date).toLocaleDateString()}
                    {isOverdue && ` (${t("overdue")})`}
                  </p>
                )}
                {debt.paid && <p className="text-[#1DB954] text-sm font-medium">✓ {t("paid")}</p>}
              </div>
            </div>
            <div className="flex flex-col space-y-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleMarkPaid(debt)}
                className={`h-8 w-8 ${debt.paid ? "text-[#1DB954]" : "text-[#B3B3B3] hover:text-[#1DB954]"}`}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => startEdit(debt)}
                className="h-8 w-8 text-[#B3B3B3] hover:text-white"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(debt)}
                className="h-8 w-8 text-[#B3B3B3] hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("debt_management")}</h1>
          <p className="text-[#B3B3B3]">{t("track_debts")}</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-[#1DB954] hover:bg-[#1ed760] text-black"
              onClick={() => {
                resetForm()
                setEditingDebt(null)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("add_debt")}
            </Button>
          </DialogTrigger>
          <DialogContent
            className="bg-[#121212] border-[#535353] text-white"
            aria-describedby="debt-dialog-description"
          >
            <DialogHeader>
              <DialogTitle>{editingDebt ? t("edit_debt") : t("add_new_debt")}</DialogTitle>
              <div id="debt-dialog-description" className="sr-only">
                {editingDebt ? "Edit existing debt record" : "Add new debt or receivable"}
              </div>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-[#B3B3B3] mb-2 block">{t("type")}</label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "owed_by_me" | "owed_to_me") =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger className="bg-[#191414] border-[#535353]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#191414] border-[#535353]">
                    <SelectItem value="owed_by_me">{t("i_owe_someone")}</SelectItem>
                    <SelectItem value="owed_to_me">{t("someone_owes_me")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-[#B3B3B3] mb-2 block">{t("person_name")}</label>
                <Input
                  value={formData.person_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, person_name: e.target.value }))}
                  className="bg-[#191414] border-[#535353]"
                  placeholder={t("enter_name")}
                  required
                />
              </div>

              <div>
                <label className="text-sm text-[#B3B3B3] mb-2 block">{t("amount")}</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                  className="bg-[#191414] border-[#535353]"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-[#B3B3B3] mb-2 block">{t("due_date_optional")}</label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, due_date: e.target.value }))}
                  className="bg-[#191414] border-[#535353]"
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setEditingDebt(null)
                    resetForm()
                  }}
                  className="flex-1 border-[#535353] text-[#B3B3B3] hover:text-white"
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 bg-[#1DB954] hover:bg-[#1ed760] text-black">
                  {loading ? t("saving") : editingDebt ? t("update") : t("add_debt")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-red-500 to-red-600 border-none">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ArrowUp className="h-5 w-5 text-white flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-white/80 text-sm truncate">{t("i_owe")}</p>
                <p className="text-2xl font-bold text-white truncate">{formatCurrency(totalOwedByMe)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-[#1DB954] to-[#1ed760] border-none">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ArrowDown className="h-5 w-5 text-black flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-black/70 text-sm truncate">{t("owed_to_me")}</p>
                <p className="text-2xl font-bold text-black truncate">{formatCurrency(totalOwedToMe)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debt Lists */}
      <Tabs defaultValue="owed-by-me" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[#121212] border border-[#535353]">
          <TabsTrigger
            value="owed-by-me"
            className="data-[state=active]:bg-[#1DB954] data-[state=active]:text-black truncate"
          >
            {t("i_owe")} ({owedByMe.filter((d) => !d.paid).length})
          </TabsTrigger>
          <TabsTrigger
            value="owed-to-me"
            className="data-[state=active]:bg-[#1DB954] data-[state=active]:text-black truncate"
          >
            {t("owed_to_me")} ({owedToMe.filter((d) => !d.paid).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="owed-by-me" className="space-y-4 mt-6">
          {owedByMe.length === 0 ? (
            <Card className="bg-[#121212] border-[#535353]">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-[#535353] mx-auto mb-4" />
                <p className="text-[#B3B3B3]">{t("no_debts_recorded")}</p>
                <p className="text-sm text-[#535353] mt-2">{t("add_debts_you_owe")}</p>
              </CardContent>
            </Card>
          ) : (
            owedByMe.map((debt) => <DebtCard key={debt.id} debt={debt} />)
          )}
        </TabsContent>

        <TabsContent value="owed-to-me" className="space-y-4 mt-6">
          {owedToMe.length === 0 ? (
            <Card className="bg-[#121212] border-[#535353]">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-[#535353] mx-auto mb-4" />
                <p className="text-[#B3B3B3]">{t("no_receivables_recorded")}</p>
                <p className="text-sm text-[#535353] mt-2">{t("add_money_others_owe")}</p>
              </CardContent>
            </Card>
          ) : (
            owedToMe.map((debt) => <DebtCard key={debt.id} debt={debt} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

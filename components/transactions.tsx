"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, TrendingUp, TrendingDown, Edit, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/components/providers"
import { useSettings } from "@/contexts/settings-context"
import type { MoneyBucket, Transaction, Goal } from "@/components/main-app"

interface TransactionsProps {
  buckets: MoneyBucket[]
  transactions: Transaction[]
  goals: Goal[]
  refreshData: () => void
}

export function Transactions({ buckets, transactions, goals, refreshData }: TransactionsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [formData, setFormData] = useState({
    amount: "",
    type: "expense" as "income" | "expense",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    bucket_id: "",
    goal_allocation: "",
    goal_id: "",
  })
  const [loading, setLoading] = useState(false)

  const { user } = useAuth()
  const { t, formatCurrency } = useSettings()
  const supabase = createClient()

  const categories = {
    income: [t("salary"), t("freelance"), t("investment"), t("gift"), t("other")],
    expense: [t("food"), t("transport"), t("shopping"), t("bills"), t("entertainment"), t("health"), t("other")],
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.bucket_id) return

    setLoading(true)
    try {
      const transactionData = {
        amount: Number.parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        description: formData.description || null,
        date: formData.date,
        bucket_id: formData.bucket_id,
        goal_allocation: formData.goal_allocation ? Number.parseFloat(formData.goal_allocation) : null,
        goal_id: formData.goal_id || null,
        user_id: user.id,
      }

      if (editingTransaction) {
        await supabase.from("transactions").update(transactionData).eq("id", editingTransaction.id)
      } else {
        await supabase.from("transactions").insert([transactionData])
      }

      // Update bucket balance
      const bucket = buckets.find((b) => b.id === formData.bucket_id)
      if (bucket) {
        const balanceChange =
          formData.type === "income" ? Number.parseFloat(formData.amount) : -Number.parseFloat(formData.amount)

        await supabase
          .from("money_buckets")
          .update({ balance: bucket.balance + balanceChange })
          .eq("id", formData.bucket_id)
      }

      // Update goal if allocation specified
      if (formData.goal_id && formData.goal_allocation) {
        const goal = goals.find((g) => g.id === formData.goal_id)
        if (goal) {
          const newAmount = goal.current_amount + Number.parseFloat(formData.goal_allocation)
          await supabase
            .from("goals")
            .update({
              current_amount: newAmount,
              completed: newAmount >= goal.target_amount,
            })
            .eq("id", formData.goal_id)
        }
      }

      resetForm()
      setIsAddDialogOpen(false)
      setEditingTransaction(null)
      refreshData()
    } catch (error) {
      console.error("Error saving transaction:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (transaction: Transaction) => {
    if (!confirm(t("confirm_delete"))) return

    try {
      await supabase.from("transactions").delete().eq("id", transaction.id)

      // Reverse bucket balance change
      const bucket = buckets.find((b) => b.id === transaction.bucket_id)
      if (bucket) {
        const balanceChange = transaction.type === "income" ? -transaction.amount : transaction.amount

        await supabase
          .from("money_buckets")
          .update({ balance: bucket.balance + balanceChange })
          .eq("id", transaction.bucket_id)
      }

      refreshData()
    } catch (error) {
      console.error("Error deleting transaction:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      amount: "",
      type: "expense",
      category: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      bucket_id: "",
      goal_allocation: "",
      goal_id: "",
    })
  }

  const startEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      amount: transaction.amount.toString(),
      type: transaction.type,
      category: transaction.category,
      description: transaction.description || "",
      date: transaction.date,
      bucket_id: transaction.bucket_id,
      goal_allocation: transaction.goal_allocation?.toString() || "",
      goal_id: transaction.goal_id || "",
    })
    setIsAddDialogOpen(true)
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("transactions")}</h1>
          <p className="text-[#B3B3B3]">{t("track_income_expenses")}</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-[#1DB954] hover:bg-[#1ed760] text-black"
              onClick={() => {
                resetForm()
                setEditingTransaction(null)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("add")}
            </Button>
          </DialogTrigger>
          <DialogContent
            className="bg-[#121212] border-[#535353] text-white"
            aria-describedby="transaction-dialog-description"
          >
            <DialogHeader>
              <DialogTitle>{editingTransaction ? t("edit_transaction") : t("add_transaction")}</DialogTitle>
              <div id="transaction-dialog-description" className="sr-only">
                {editingTransaction ? "Edit existing transaction details" : "Add new income or expense transaction"}
              </div>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[#B3B3B3] mb-2 block">{t("type")}</label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "income" | "expense") =>
                      setFormData((prev) => ({ ...prev, type: value, category: "" }))
                    }
                  >
                    <SelectTrigger className="bg-[#191414] border-[#535353]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#191414] border-[#535353]">
                      <SelectItem value="income">{t("income")}</SelectItem>
                      <SelectItem value="expense">{t("expense")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-[#B3B3B3] mb-2 block">{t("amount")}</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                    className="bg-[#191414] border-[#535353]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-[#B3B3B3] mb-2 block">{t("category")}</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="bg-[#191414] border-[#535353]">
                    <SelectValue placeholder={t("select_category")} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#191414] border-[#535353]">
                    {categories[formData.type].map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-[#B3B3B3] mb-2 block">{t("money_bucket")}</label>
                <Select
                  value={formData.bucket_id}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, bucket_id: value }))}
                >
                  <SelectTrigger className="bg-[#191414] border-[#535353]">
                    <SelectValue placeholder={t("select_bucket")} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#191414] border-[#535353]">
                    {buckets.map((bucket) => (
                      <SelectItem key={bucket.id} value={bucket.id}>
                        {bucket.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-[#B3B3B3] mb-2 block">{t("description_optional")}</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="bg-[#191414] border-[#535353]"
                  placeholder={t("add_note")}
                />
              </div>

              <div>
                <label className="text-sm text-[#B3B3B3] mb-2 block">{t("date")}</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  className="bg-[#191414] border-[#535353]"
                  required
                />
              </div>

              {formData.type === "income" && goals.length > 0 && (
                <div className="space-y-4 p-4 bg-[#191414] rounded-lg">
                  <h4 className="text-sm font-medium text-[#1DB954]">{t("goal_allocation_optional")}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-[#B3B3B3] mb-2 block">{t("goal")}</label>
                      <Select
                        value={formData.goal_id}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, goal_id: value }))}
                      >
                        <SelectTrigger className="bg-[#121212] border-[#535353]">
                          <SelectValue placeholder={t("select_goal")} />
                        </SelectTrigger>
                        <SelectContent className="bg-[#121212] border-[#535353]">
                          {goals
                            .filter((g) => !g.completed)
                            .map((goal) => (
                              <SelectItem key={goal.id} value={goal.id}>
                                {goal.title}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-[#B3B3B3] mb-2 block">{t("amount")}</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.goal_allocation}
                        onChange={(e) => setFormData((prev) => ({ ...prev, goal_allocation: e.target.value }))}
                        className="bg-[#121212] border-[#535353]"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setEditingTransaction(null)
                    resetForm()
                  }}
                  className="flex-1 border-[#535353] text-[#B3B3B3] hover:text-white"
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 bg-[#1DB954] hover:bg-[#1ed760] text-black">
                  {loading ? t("saving") : editingTransaction ? t("update") : t("add_transaction")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {transactions.length === 0 ? (
          <Card className="bg-[#121212] border-[#535353]">
            <CardContent className="p-8 text-center">
              <p className="text-[#B3B3B3]">{t("no_transactions_yet")}</p>
              <p className="text-sm text-[#535353] mt-2">Add your first transaction to get started</p>
            </CardContent>
          </Card>
        ) : (
          transactions.map((transaction) => {
            const bucket = buckets.find((b) => b.id === transaction.bucket_id)
            const goal = transaction.goal_id ? goals.find((g) => g.id === transaction.goal_id) : null

            return (
              <Card key={transaction.id} className="bg-[#121212] border-[#535353]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          transaction.type === "income" ? "bg-[#1DB954]" : "bg-red-500"
                        }`}
                      >
                        {transaction.type === "income" ? (
                          <TrendingUp className="h-6 w-6 text-black" />
                        ) : (
                          <TrendingDown className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium truncate">{transaction.category}</p>
                        <p className="text-[#B3B3B3] text-sm truncate">{bucket?.name}</p>
                        {transaction.description && (
                          <p className="text-[#535353] text-sm truncate">{transaction.description}</p>
                        )}
                        {goal && transaction.goal_allocation && (
                          <p className="text-[#1DB954] text-sm truncate">
                            {formatCurrency(transaction.goal_allocation)} → {goal.title}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <div className="text-right">
                        <p
                          className={`text-lg font-semibold ${
                            transaction.type === "income" ? "text-[#1DB954]" : "text-red-400"
                          }`}
                        >
                          {transaction.type === "income" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-[#B3B3B3] text-sm">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEdit(transaction)}
                          className="h-8 w-8 text-[#B3B3B3] hover:text-[#1DB954]"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(transaction)}
                          className="h-8 w-8 text-[#B3B3B3] hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

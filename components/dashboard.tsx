"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, TrendingUp, TrendingDown, Target, Wallet } from "lucide-react"
import { XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from "recharts"
import type { MoneyBucket, Transaction, Goal, Debt } from "@/components/main-app"
import { useSettings } from "@/contexts/settings-context"

interface DashboardProps {
  buckets: MoneyBucket[]
  transactions: Transaction[]
  goals: Goal[]
  debts: Debt[]
  refreshData: () => void
}

export function Dashboard({ buckets, transactions, goals, debts }: DashboardProps) {
  const [showBalance, setShowBalance] = useState(true)
  const { t, formatCurrency } = useSettings()

  const totalBalance = buckets.reduce((sum, bucket) => sum + bucket.balance, 0)
  const totalGoalProgress = goals.reduce((sum, goal) => sum + goal.current_amount, 0)
  const totalGoalTarget = goals.reduce((sum, goal) => sum + goal.target_amount, 0)
  const totalOwedByMe = debts.filter((d) => d.type === "owed_by_me" && !d.paid).reduce((sum, d) => sum + d.amount, 0)
  const totalOwedToMe = debts.filter((d) => d.type === "owed_to_me" && !d.paid).reduce((sum, d) => sum + d.amount, 0)

  // Monthly summary data
  const monthlyData = transactions.reduce(
    (acc, transaction) => {
      const month = new Date(transaction.date).toLocaleDateString("en-US", { month: "short" })
      const existing = acc.find((item) => item.month === month)

      if (existing) {
        if (transaction.type === "income") {
          existing.income += transaction.amount
        } else {
          existing.expense += transaction.amount
        }
      } else {
        acc.push({
          month,
          income: transaction.type === "income" ? transaction.amount : 0,
          expense: transaction.type === "expense" ? transaction.amount : 0,
        })
      }

      return acc
    },
    [] as Array<{ month: string; income: number; expense: number }>,
  )

  const formatDisplayCurrency = (amount: number) => {
    return showBalance ? formatCurrency(amount) : "****"
  }

  return (
    <div className="p-4 space-y-6 theme-transition" style={{ backgroundColor: "#191414", color: "#FFFFFF" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#FFFFFF" }}>
            {t("dashboard")}
          </h1>
          <p style={{ color: "#B3B3B3" }}>{t("welcome_back")}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowBalance(!showBalance)}
          style={{ color: "#B3B3B3" }}
          className="hover:text-white"
        >
          {showBalance ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
        </Button>
      </div>

      {/* Total Balance Card */}
      <Card className="bg-gradient-to-r from-[#1DB954] to-[#1DB954]/90 border-none theme-transition">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-black/70 text-sm font-medium">{t("total_balance")}</p>
              <p className="text-3xl font-bold text-black">{formatDisplayCurrency(totalBalance)}</p>
            </div>
            <Wallet className="h-8 w-8 text-black/70" />
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card style={{ backgroundColor: "#121212", borderColor: "#535353" }} className="theme-transition">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5" style={{ color: "#1DB954" }} />
              <div className="min-w-0 flex-1">
                <p className="text-xs truncate" style={{ color: "#B3B3B3" }}>
                  {t("goals_progress")}
                </p>
                <p className="text-lg font-semibold truncate" style={{ color: "#FFFFFF" }}>
                  {formatDisplayCurrency(totalGoalProgress)}
                </p>
                <p className="text-xs truncate" style={{ color: "#B3B3B3" }}>
                  of {formatDisplayCurrency(totalGoalTarget)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: "#121212", borderColor: "#535353" }} className="theme-transition">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-400" />
              <div className="min-w-0 flex-1">
                <p className="text-xs truncate" style={{ color: "#B3B3B3" }}>
                  {t("net_debt")}
                </p>
                <p className="text-lg font-semibold truncate" style={{ color: "#FFFFFF" }}>
                  {formatDisplayCurrency(totalOwedByMe - totalOwedToMe)}
                </p>
                <p className="text-xs truncate" style={{ color: "#B3B3B3" }}>
                  {totalOwedByMe > totalOwedToMe ? t("you_owe") : t("others_owe_you")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary Chart */}
      <Card style={{ backgroundColor: "#121212", borderColor: "#535353" }} className="theme-transition">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2" style={{ color: "#FFFFFF" }}>
            <TrendingUp className="h-5 w-5" style={{ color: "#1DB954" }} />
            <span>{t("monthly_summary")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#B3B3B3", fontSize: 12 }} />
                <YAxis hide />
                <Bar dataKey="income" fill="#1DB954" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expense" fill="#ff6b6b" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#1DB954" }}></div>
              <span className="text-sm" style={{ color: "#B3B3B3" }}>
                {t("income")}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-[#ff6b6b] rounded-full"></div>
              <span className="text-sm" style={{ color: "#B3B3B3" }}>
                {t("expense")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Money Buckets */}
      <Card style={{ backgroundColor: "#121212", borderColor: "#535353" }} className="theme-transition">
        <CardHeader>
          <CardTitle style={{ color: "#FFFFFF" }}>{t("money_buckets")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {buckets.length === 0 ? (
              <p className="text-center py-4" style={{ color: "#B3B3B3" }}>
                {t("no_buckets_yet")}
              </p>
            ) : (
              buckets.map((bucket) => (
                <div
                  key={bucket.id}
                  className="flex items-center justify-between p-3 rounded-lg theme-transition"
                  style={{ backgroundColor: "#191414", borderColor: "#535353" }}
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
                      <p className="text-sm truncate" style={{ color: "#B3B3B3" }}>
                        {formatDisplayCurrency(bucket.balance)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card style={{ backgroundColor: "#121212", borderColor: "#535353" }} className="theme-transition">
        <CardHeader>
          <CardTitle style={{ color: "#FFFFFF" }}>{t("recent_transactions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.slice(0, 5).map((transaction) => {
              const bucket = buckets.find((b) => b.id === transaction.bucket_id)
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg theme-transition"
                  style={{ backgroundColor: "#191414", borderColor: "#535353" }}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0`}
                      style={{ backgroundColor: transaction.type === "income" ? "#1DB954" : "#ff6b6b" }}
                    >
                      {transaction.type === "income" ? (
                        <TrendingUp className="h-5 w-5 text-black" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate" style={{ color: "#FFFFFF" }}>
                        {transaction.category}
                      </p>
                      <p className="text-sm truncate" style={{ color: "#B3B3B3" }}>
                        {bucket?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`font-semibold`}
                      style={{ color: transaction.type === "income" ? "#1DB954" : "#ff6b6b" }}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatDisplayCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm" style={{ color: "#B3B3B3" }}>
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )
            })}
            {transactions.length === 0 && (
              <p className="text-center py-4" style={{ color: "#B3B3B3" }}>
                {t("no_transactions_yet")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

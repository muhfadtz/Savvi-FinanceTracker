"use client"

import { Home, Plus, Target, Users, User } from "lucide-react"
import type { TabType } from "@/components/main-app"
import { useSettings } from "@/contexts/settings-context"

interface BottomNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const { t } = useSettings()

  const tabs = [
    { id: "dashboard" as TabType, icon: Home, label: t("dashboard") },
    { id: "transactions" as TabType, icon: Plus, label: t("transactions") },
    { id: "goals" as TabType, icon: Target, label: t("goals") },
    { id: "owed" as TabType, icon: Users, label: t("owed") },
    { id: "profile" as TabType, icon: User, label: t("profile") },
  ]

  return (
    <div
      className="px-2 py-2 safe-area-bottom theme-transition border-t"
      style={{
        backgroundColor: "#121212",
        borderTopColor: "#535353",
        color: "#FFFFFF",
      }}
    >
      <div className="flex justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors min-w-0`}
              style={{
                color: isActive ? "#1DB954" : "#B3B3B3",
                backgroundColor: isActive ? "rgba(29, 185, 84, 0.1)" : "transparent",
              }}
            >
              <Icon className="h-5 w-5 mb-1 flex-shrink-0" />
              <span className="text-xs font-medium truncate max-w-[60px]">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

"use client"

import { Switch } from "@/components/ui/switch"
import { Sun, Moon } from "lucide-react"
import { useSettings } from "@/contexts/settings-context"

export function ThemeToggle() {
  const { darkMode, setDarkMode, t } = useSettings()

  const handleToggle = (checked: boolean) => {
    console.log("🎨 Theme toggle clicked:", checked ? "dark" : "light")
    setDarkMode(checked)
  }

  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg border theme-transition">
      <div className="flex items-center space-x-3">
        {darkMode ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
        <div>
          <p className="font-medium">{darkMode ? t("dark_mode") : t("light_mode")}</p>
          <p className="text-muted-foreground text-sm">{t("toggle_theme")}</p>
        </div>
      </div>
      <Switch checked={darkMode} onCheckedChange={handleToggle} className="theme-transition" />
    </div>
  )
}

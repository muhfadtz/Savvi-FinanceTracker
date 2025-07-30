"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Edit, Loader2 } from "lucide-react"

const vegetableAvatars = [
  "🥕",
  "🥬",
  "🥒",
  "🍅",
  "🥔",
  "🧄",
  "🧅",
  "🌶️",
  "🥦",
  "🌽",
  "🍆",
  "🥑",
  "🫑",
  "🥜",
  "🫘",
  "🥗",
  "🥖",
  "🍄",
  "🫐",
  "🍇",
  "🍊",
  "🍋",
  "🍌",
  "🍎",
]

interface AvatarPickerProps {
  currentAvatar: string
  onAvatarChange: (avatar: string) => Promise<void>
  loading?: boolean
  size?: "sm" | "md" | "lg"
  showEditButton?: boolean
}

export function AvatarPicker({
  currentAvatar,
  onAvatarChange,
  loading = false,
  size = "md",
  showEditButton = true,
}: AvatarPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar)

  const sizeClasses = {
    sm: "w-8 h-8 text-lg",
    md: "w-16 h-16 text-2xl",
    lg: "w-24 h-24 text-4xl",
  }

  const handleAvatarSelect = async (avatar: string) => {
    console.log("🥕 Avatar selected:", avatar)
    setSelectedAvatar(avatar)

    try {
      await onAvatarChange(avatar)
      setIsOpen(false)
    } catch (error) {
      console.error("❌ Avatar change failed:", error)
      setSelectedAvatar(currentAvatar) // Revert on error
    }
  }

  return (
    <div className="relative">
      <div className={`${sizeClasses[size]} bg-primary rounded-full flex items-center justify-center flex-shrink-0`}>
        {currentAvatar || "🥕"}
      </div>

      {showEditButton && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full p-0 bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Edit className="h-3 w-3" />}
            </Button>
          </DialogTrigger>
          <DialogContent className="theme-transition max-w-sm">
            <DialogHeader>
              <DialogTitle>Choose Your Avatar</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Pick your favorite veggie or fruit:</p>

              {/* Current Selection */}
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-4xl mb-2">{selectedAvatar}</div>
                <p className="text-sm text-muted-foreground">Current Selection</p>
              </div>

              {/* Avatar Grid */}
              <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                {vegetableAvatars.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => handleAvatarSelect(avatar)}
                    disabled={loading}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all hover:scale-110 disabled:opacity-50 ${
                      selectedAvatar === avatar
                        ? "bg-primary scale-110 ring-2 ring-primary ring-offset-2"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Selected: {selectedAvatar}</span>
                <span>{vegetableAvatars.length} options</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

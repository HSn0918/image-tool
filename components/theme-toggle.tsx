"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className={cn("h-9 w-9 relative", className)}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "切换到浅色模式" : "切换到深色模式"}
    >
      <Sun
        className={cn(
          "h-4 w-4 rotate-0 scale-100 transition-all",
          isDark && "-rotate-90 scale-0"
        )}
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 rotate-90 scale-0 transition-all",
          isDark && "rotate-0 scale-100"
        )}
      />
      <span className="sr-only">切换主题</span>
    </Button>
  )
}
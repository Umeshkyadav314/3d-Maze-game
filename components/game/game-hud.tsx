"use client"

import { useEffect, useRef, useState } from "react"
import { useGame } from "@/contexts/game-context"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Heart, Timer, Trophy, Zap, Pause, Play, RotateCcw, Bot } from "lucide-react"

export default function GameHUD() {
  const {
    gameState,
    setGameState,
    level,
    score,
    timeElapsed,
    updateTime,
    health,
    autoMode,
    toggleAutoMode,
    resetGame,
  } = useGame()

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => {
        updateTime(timeElapsed + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [gameState, timeElapsed, updateTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (gameState === "menu") return null

  return (
    <div className="absolute inset-x-0 top-0 z-20 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 bg-background/80 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-border">
          {/* Health */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-[80px] sm:min-w-[120px]">
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
            <Progress value={health} className="h-2 flex-1 min-w-[40px]" />
            <span className="text-xs sm:text-sm font-mono w-6 sm:w-8">{health}</span>
          </div>

          {/* Level & Score - combined on mobile */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              <span className="font-semibold text-xs sm:text-base">L{level}</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              <span className="font-mono font-semibold text-xs sm:text-base">{score.toLocaleString()}</span>
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Timer className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            <span className="font-mono text-xs sm:text-base">{formatTime(timeElapsed)}</span>
          </div>

          {/* Controls - simplified on mobile */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant={autoMode ? "default" : "outline"}
              size="sm"
              onClick={toggleAutoMode}
              title="Auto Mode"
              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
            >
              <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGameState(gameState === "paused" ? "playing" : "paused")}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
            >
              {gameState === "paused" ? (
                <Play className="w-3 h-3 sm:w-4 sm:h-4" />
              ) : (
                <Pause className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetGame}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 bg-transparent"
            >
              <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>

        {/* Instructions - hide on mobile since we have on-screen controls */}
        {!isMobile && (
          <div className="mt-2 text-center">
            <p className="text-xs text-muted-foreground bg-background/60 backdrop-blur-sm inline-block px-3 py-1 rounded-full">
              WASD/Arrows to move | Q/E or Mouse to look | Click zombies to shoot
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

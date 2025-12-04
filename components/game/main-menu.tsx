"use client"

import { useState, useEffect } from "react"
import { useGame } from "@/contexts/game-context"
import { useUser } from "@/contexts/user-context"
import { useTheme } from "@/contexts/theme-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Play, Trophy, User, Sun, Moon, LogIn, Smartphone, Monitor } from "lucide-react"
import Link from "next/link"

export default function MainMenu() {
  const { gameState, startGame } = useGame()
  const { user, isLoading } = useUser()
  const { theme, toggleTheme } = useTheme()
  const [startLevel, setStartLevel] = useState(1)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.matchMedia("(max-width: 1024px)").matches || "ontouchstart" in window || navigator.maxTouchPoints > 0,
      )
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  if (gameState !== "menu") return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-lg space-y-4 sm:space-y-6">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-balance">
            3D Maze
            <span className="text-primary"> Navigator</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground px-4">
            Navigate through procedurally generated mazes, avoid zombies, and reach the goal!
          </p>
        </div>

        {/* Main Menu Card */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
              <span>Start Game</span>
              <div className="flex items-center gap-2">
                {isMobile ? (
                  <Smartphone className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Monitor className="w-4 h-4 text-muted-foreground" />
                )}
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              </div>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Configure your game settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Level Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Starting Level</Label>
                <span className="font-mono text-base sm:text-lg font-semibold">{startLevel}</span>
              </div>
              <Slider
                value={[startLevel]}
                onValueChange={([value]) => setStartLevel(value)}
                min={1}
                max={10}
                step={1}
                className="touch-none"
              />
              <p className="text-xs text-muted-foreground">Higher levels have larger mazes and more zombies</p>
            </div>

            {/* Start Button */}
            <Button className="w-full h-12 text-base sm:text-lg" onClick={() => startGame(startLevel)}>
              <Play className="w-5 h-5 mr-2" />
              Start Game
            </Button>

            {/* Navigation Links */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Link href="/leaderboard">
                <Button variant="outline" className="w-full bg-transparent text-xs sm:text-sm h-9 sm:h-10">
                  <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Leaderboard
                </Button>
              </Link>
              {!isLoading &&
                (user ? (
                  <Link href="/profile">
                    <Button variant="outline" className="w-full bg-transparent text-xs sm:text-sm h-9 sm:h-10">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Profile
                    </Button>
                  </Link>
                ) : (
                  <Link href="/login">
                    <Button variant="outline" className="w-full bg-transparent text-xs sm:text-sm h-9 sm:h-10">
                      <LogIn className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Login
                    </Button>
                  </Link>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <h3 className="font-semibold mb-3 text-sm sm:text-base flex items-center gap-2">
              {isMobile ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
              {isMobile ? "Touch Controls" : "Keyboard Controls"}
            </h3>

            {isMobile ? (
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-xs">L</div>
                  <span className="text-muted-foreground">Left Joystick - Move around</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-xs">R</div>
                  <span className="text-muted-foreground">Right Joystick - Look around</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center text-xs text-red-400">
                    +
                  </div>
                  <span className="text-muted-foreground">Center Button - Shoot zombies</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">W</kbd>
                  <span className="text-muted-foreground">Forward</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">S</kbd>
                  <span className="text-muted-foreground">Backward</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">A</kbd>
                  <span className="text-muted-foreground">Strafe Left</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">D</kbd>
                  <span className="text-muted-foreground">Strafe Right</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Q/E</kbd>
                  <span className="text-muted-foreground">Rotate</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Mouse</kbd>
                  <span className="text-muted-foreground">Look</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Info */}
        {user && (
          <p className="text-center text-xs sm:text-sm text-muted-foreground">
            Playing as <span className="font-semibold text-foreground">{user.username}</span>
          </p>
        )}
      </div>
    </div>
  )
}

"use client"

import { useGame } from "@/contexts/game-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Home, RotateCcw } from "lucide-react"

export default function PauseMenu() {
  const { gameState, setGameState, resetGame, startGame, level } = useGame()

  if (gameState !== "paused") return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-sm mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Game Paused</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" onClick={() => setGameState("playing")}>
            <Play className="w-4 h-4 mr-2" />
            Resume
          </Button>
          <Button variant="outline" className="w-full bg-transparent" onClick={() => startGame(level)}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Restart Level
          </Button>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" className="w-full" onClick={resetGame}>
            <Home className="w-4 h-4 mr-2" />
            Main Menu
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

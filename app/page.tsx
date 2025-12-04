"use client"

import dynamic from "next/dynamic"
import MainMenu from "@/components/game/main-menu"
import GameHUD from "@/components/game/game-hud"
import MiniMap from "@/components/game/mini-map"
import GameOverModal from "@/components/game/game-over-modal"
import PauseMenu from "@/components/game/pause-menu"
import MobileControls from "@/components/game/mobile-controls"
import { useGame } from "@/contexts/game-context"

const MazeScene = dynamic(() => import("@/components/game/maze-scene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground">Loading 3D Engine...</p>
      </div>
    </div>
  ),
})

export default function GamePage() {
  const { gameState } = useGame()

  return (
    <main className="relative w-full h-screen overflow-hidden bg-background touch-none">
      <MainMenu />
      {gameState !== "menu" && (
        <>
          <MazeScene />
          <GameHUD />
          <MiniMap />
          <MobileControls />
          <GameOverModal />
          <PauseMenu />
        </>
      )}
    </main>
  )
}

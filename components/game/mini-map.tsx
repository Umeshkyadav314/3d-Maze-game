"use client"

import { useState, useEffect } from "react"
import { useGame } from "@/contexts/game-context"

export default function MiniMap() {
  const { maze, playerPosition, autoPath, zombies, gameState } = useGame()
  const [mapSize, setMapSize] = useState(150)

  useEffect(() => {
    const updateSize = () => {
      if (window.innerWidth < 640) {
        setMapSize(100)
      } else if (window.innerWidth < 1024) {
        setMapSize(120)
      } else {
        setMapSize(150)
      }
    }
    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  if (!maze || gameState === "menu") return null

  const CELL_SIZE = 10

  return (
    <div className="absolute bottom-4 left-4 sm:top-20 sm:bottom-auto sm:right-4 sm:left-auto z-10">
      <div
        className="relative border-2 border-foreground/50 rounded-lg overflow-hidden bg-background/80 backdrop-blur-sm shadow-lg"
        style={{ width: mapSize, height: mapSize }}
      >
        <svg width={mapSize} height={mapSize} viewBox={`0 0 ${maze.width * CELL_SIZE} ${maze.height * CELL_SIZE}`}>
          {/* Background */}
          <rect
            width={maze.width * CELL_SIZE}
            height={maze.height * CELL_SIZE}
            fill="currentColor"
            className="text-muted"
          />

          {/* Walls */}
          {maze.cells.map((row, x) =>
            row.map((cell, z) => (
              <g key={`${x}-${z}`}>
                {cell.walls.north && (
                  <line
                    x1={x * CELL_SIZE}
                    y1={z * CELL_SIZE}
                    x2={(x + 1) * CELL_SIZE}
                    y2={z * CELL_SIZE}
                    stroke="currentColor"
                    strokeWidth={1}
                    className="text-foreground"
                  />
                )}
                {cell.walls.west && (
                  <line
                    x1={x * CELL_SIZE}
                    y1={z * CELL_SIZE}
                    x2={x * CELL_SIZE}
                    y2={(z + 1) * CELL_SIZE}
                    stroke="currentColor"
                    strokeWidth={1}
                    className="text-foreground"
                  />
                )}
                {z === maze.height - 1 && cell.walls.south && (
                  <line
                    x1={x * CELL_SIZE}
                    y1={(z + 1) * CELL_SIZE}
                    x2={(x + 1) * CELL_SIZE}
                    y2={(z + 1) * CELL_SIZE}
                    stroke="currentColor"
                    strokeWidth={1}
                    className="text-foreground"
                  />
                )}
                {x === maze.width - 1 && cell.walls.east && (
                  <line
                    x1={(x + 1) * CELL_SIZE}
                    y1={z * CELL_SIZE}
                    x2={(x + 1) * CELL_SIZE}
                    y2={(z + 1) * CELL_SIZE}
                    stroke="currentColor"
                    strokeWidth={1}
                    className="text-foreground"
                  />
                )}
              </g>
            )),
          )}

          {/* Auto path */}
          {autoPath.length > 0 && (
            <polyline
              points={autoPath
                .map((p) => `${p.x * CELL_SIZE + CELL_SIZE / 2},${p.z * CELL_SIZE + CELL_SIZE / 2}`)
                .join(" ")}
              fill="none"
              stroke="#48bb78"
              strokeWidth={2}
              strokeDasharray="4 2"
              opacity={0.7}
            />
          )}

          {/* Goal */}
          <rect
            x={maze.goal.x * CELL_SIZE + 2}
            y={maze.goal.z * CELL_SIZE + 2}
            width={CELL_SIZE - 4}
            height={CELL_SIZE - 4}
            fill="#48bb78"
          />

          {/* Zombies */}
          {zombies.map((zombie) => (
            <circle
              key={zombie.id}
              cx={zombie.x * CELL_SIZE + CELL_SIZE / 2}
              cy={zombie.z * CELL_SIZE + CELL_SIZE / 2}
              r={3}
              fill="#e53e3e"
            />
          ))}

          {/* Player */}
          <circle cx={playerPosition.x * CELL_SIZE} cy={playerPosition.z * CELL_SIZE} r={4} fill="#3182ce" />
        </svg>
      </div>
      <p className="text-xs text-center mt-1 text-muted-foreground hidden sm:block">Mini Map</p>
    </div>
  )
}

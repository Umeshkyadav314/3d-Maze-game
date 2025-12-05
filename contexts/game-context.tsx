"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { type Maze, generateMaze, findPath } from "@/lib/maze-generator"

export type GameState = "menu" | "playing" | "paused" | "won" | "gameover"

type GameContextType = {
  gameState: GameState
  setGameState: (state: GameState) => void
  maze: Maze | null
  level: number
  score: number
  timeElapsed: number
  playerPosition: { x: number; z: number }
  playerRotation: number
  autoMode: boolean
  autoPath: { x: number; z: number }[]
  health: number
  zombies: { x: number; z: number; id: string }[]
  startGame: (level?: number) => void
  resetGame: () => void
  movePlayer: (dx: number, dz: number) => boolean
  rotatePlayer: (angle: number) => void
  setPlayerPosition: (pos: { x: number; z: number }) => void
  toggleAutoMode: () => void
  updateTime: (time: number) => void
  addScore: (points: number) => void
  takeDamage: (damage: number) => void
  shootZombie: (zombieId: string) => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>("menu")
  const [maze, setMaze] = useState<Maze | null>(null)
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [playerPosition, setPlayerPosition] = useState({ x: 0, z: 0 })
  const [playerRotation, setPlayerRotation] = useState(0)
  const [autoMode, setAutoMode] = useState(false)
  const [autoPath, setAutoPath] = useState<{ x: number; z: number }[]>([])
  const [health, setHealth] = useState(100)
  const [zombies, setZombies] = useState<{ x: number; z: number; id: string }[]>([])

  const getMazeSize = (lvl: number) => {
    const baseSize = 10
    return Math.min(baseSize + Math.floor((lvl - 1) * 2), 20)
  }

  const spawnZombies = useCallback((mazeData: Maze, count: number) => {
    const newZombies: { x: number; z: number; id: string }[] = []
    for (let i = 0; i < count; i++) {
      let x, z
      do {
        x = Math.floor(Math.random() * mazeData.width)
        z = Math.floor(Math.random() * mazeData.height)
      } while ((x === mazeData.start.x && z === mazeData.start.z) || (x === mazeData.goal.x && z === mazeData.goal.z))
      newZombies.push({ x, z, id: crypto.randomUUID() })
    }
    return newZombies
  }, [])

  const startGame = useCallback(
    (startLevel = 1) => {
      const size = getMazeSize(startLevel)
      const newMaze = generateMaze(size, size)
      setMaze(newMaze)
      setLevel(startLevel)
      setScore(0)
      setTimeElapsed(0)
      setPlayerPosition({ x: 0.5, z: 0.5 })
      setPlayerRotation(0)
      setAutoMode(false)
      setAutoPath([])
      setHealth(100)
      setZombies(spawnZombies(newMaze, Math.min(startLevel + 2, 10)))
      setGameState("playing")
    },
    [spawnZombies],
  )

  const resetGame = useCallback(() => {
    setGameState("menu")
    setMaze(null)
    setLevel(1)
    setScore(0)
    setTimeElapsed(0)
    setPlayerPosition({ x: 0, z: 0 })
    setAutoMode(false)
    setAutoPath([])
    setHealth(100)
    setZombies([])
  }, [])

  const movePlayer = useCallback(
    (dx: number, dz: number): boolean => {
      if (!maze || gameState !== "playing") return false

      const newX = playerPosition.x + dx
      const newZ = playerPosition.z + dz

      // Get current and target cell
      const currentCellX = Math.floor(playerPosition.x)
      const currentCellZ = Math.floor(playerPosition.z)
      const targetCellX = Math.floor(newX)
      const targetCellZ = Math.floor(newZ)

      // Boundary check with padding
      const padding = 0.15
      if (newX < padding || newX >= maze.width - padding || newZ < padding || newZ >= maze.height - padding) {
        return false
      }

      // Wall collision check with sliding
      let canMoveX = true
      let canMoveZ = true

      const currentCell = maze.cells[currentCellX]?.[currentCellZ]
      if (!currentCell) return false

      // Check if we're crossing a cell boundary
      const crossingX = currentCellX !== targetCellX
      const crossingZ = currentCellZ !== targetCellZ

      // Player radius for collision detection
      const playerRadius = 0.2
      const cellLocalX = playerPosition.x - currentCellX
      const cellLocalZ = playerPosition.z - currentCellZ

      // Check X movement (east/west)
      if (dx !== 0) {
        if (crossingX) {
          // Crossing cell boundary - check wall
          if (targetCellX > currentCellX && currentCell.walls.east) {
            canMoveX = false
          } else if (targetCellX < currentCellX && currentCell.walls.west) {
            canMoveX = false
          }
        } else {
          // Within same cell - check proximity to walls
          if (dx > 0 && currentCell.walls.east && cellLocalX + playerRadius >= 1) {
            canMoveX = false
          } else if (dx < 0 && currentCell.walls.west && cellLocalX - playerRadius <= 0) {
            canMoveX = false
          }
        }
      }

      // Check Z movement (south/north)
      if (dz !== 0) {
        if (crossingZ) {
          // Crossing cell boundary - check wall
          if (targetCellZ > currentCellZ && currentCell.walls.south) {
            canMoveZ = false
          } else if (targetCellZ < currentCellZ && currentCell.walls.north) {
            canMoveZ = false
          }
        } else {
          // Within same cell - check proximity to walls
          if (dz > 0 && currentCell.walls.south && cellLocalZ + playerRadius >= 1) {
            canMoveZ = false
          } else if (dz < 0 && currentCell.walls.north && cellLocalZ - playerRadius <= 0) {
            canMoveZ = false
          }
        }
      }

      // Apply sliding movement - move in allowed directions
      const finalX = canMoveX ? newX : playerPosition.x
      const finalZ = canMoveZ ? newZ : playerPosition.z

      // Only update if there's actual movement
      if (finalX !== playerPosition.x || finalZ !== playerPosition.z) {
        setPlayerPosition({ x: finalX, z: finalZ })

        // Check if reached goal
        if (Math.floor(finalX) === maze.goal.x && Math.floor(finalZ) === maze.goal.z) {
          const timeBonus = Math.max(0, 1000 - timeElapsed)
          const levelBonus = level * 500
          setScore((prev) => prev + timeBonus + levelBonus)
          setGameState("won")
        }
        return true
      }

      return false
    },
    [maze, gameState, playerPosition, timeElapsed, level],
  )

  const rotatePlayer = useCallback((angle: number) => {
    setPlayerRotation((prev) => prev + angle)
  }, [])

  const toggleAutoMode = useCallback(() => {
    if (!maze) return

    setAutoMode((prev) => {
      if (!prev) {
        const cellX = Math.floor(playerPosition.x)
        const cellZ = Math.floor(playerPosition.z)
        const path = findPath(maze, { x: cellX, z: cellZ }, maze.goal)
        setAutoPath(path)
      } else {
        setAutoPath([])
      }
      return !prev
    })
  }, [maze, playerPosition])

  const updateTime = useCallback((time: number) => {
    setTimeElapsed(time)
  }, [])

  const addScore = useCallback((points: number) => {
    setScore((prev) => prev + points)
  }, [])

  const takeDamage = useCallback((damage: number) => {
    setHealth((prev) => {
      const newHealth = Math.max(0, prev - damage)
      if (newHealth === 0) {
        setGameState("gameover")
      }
      return newHealth
    })
  }, [])

  const shootZombie = useCallback((zombieId: string) => {
    setZombies((prev) => prev.filter((z) => z.id !== zombieId))
    setScore((prev) => prev + 100)
  }, [])

  return (
    <GameContext.Provider
      value={{
        gameState,
        setGameState,
        maze,
        level,
        score,
        timeElapsed,
        playerPosition,
        playerRotation,
        autoMode,
        autoPath,
        health,
        zombies,
        startGame,
        resetGame,
        movePlayer,
        rotatePlayer,
        setPlayerPosition,
        toggleAutoMode,
        updateTime,
        addScore,
        takeDamage,
        shootZombie,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider")
  }
  return context
}

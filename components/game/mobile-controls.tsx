"use client"

import type React from "react"

import { useRef, useState, useCallback, useEffect } from "react"
import { useGame } from "@/contexts/game-context"
import { Button } from "@/components/ui/button"
import { Crosshair } from "lucide-react"

export default function MobileControls() {
  const { gameState, movePlayer, rotatePlayer } = useGame()
  const [isMobile, setIsMobile] = useState(false)
  const [leftJoystick, setLeftJoystick] = useState({ active: false, x: 0, y: 0 })
  const [rightJoystick, setRightJoystick] = useState({ active: false, x: 0, y: 0 })
  const leftJoystickRef = useRef<HTMLDivElement>(null)
  const rightJoystickRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)

  // Detect mobile device
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

  // Handle joystick movement
  const handleJoystickMove = useCallback(
    (
      e: React.TouchEvent,
      joystickRef: React.RefObject<HTMLDivElement>,
      setJoystick: React.Dispatch<React.SetStateAction<{ active: boolean; x: number; y: number }>>,
    ) => {
      if (!joystickRef.current) return

      const rect = joystickRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const touch = e.touches[0]
      let deltaX = (touch.clientX - centerX) / (rect.width / 2)
      let deltaY = (touch.clientY - centerY) / (rect.height / 2)

      // Clamp values to -1 to 1
      const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      if (magnitude > 1) {
        deltaX /= magnitude
        deltaY /= magnitude
      }

      setJoystick({ active: true, x: deltaX, y: deltaY })
    },
    [],
  )

  const handleJoystickEnd = useCallback(
    (setJoystick: React.Dispatch<React.SetStateAction<{ active: boolean; x: number; y: number }>>) => {
      setJoystick({ active: false, x: 0, y: 0 })
    },
    [],
  )

  // Game loop for smooth movement
  useEffect(() => {
    if (gameState !== "playing") return

    const updateMovement = () => {
      const moveSpeed = 0.08
      const rotSpeed = 0.04

      // Left joystick - movement
      if (leftJoystick.active || leftJoystick.x !== 0 || leftJoystick.y !== 0) {
        movePlayer(leftJoystick.x * moveSpeed, leftJoystick.y * moveSpeed)
      }

      // Right joystick - rotation
      if (rightJoystick.active || rightJoystick.x !== 0) {
        rotatePlayer(-rightJoystick.x * rotSpeed)
      }

      animationRef.current = requestAnimationFrame(updateMovement)
    }

    animationRef.current = requestAnimationFrame(updateMovement)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState, leftJoystick, rightJoystick, movePlayer, rotatePlayer])

  if (!isMobile || gameState !== "playing") return null

  return (
    <div className="fixed inset-0 z-30 pointer-events-none">
      {/* Shoot button - center top */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
        <Button
          variant="outline"
          size="icon"
          className="w-16 h-16 rounded-full bg-red-500/20 border-red-500/50 backdrop-blur-sm"
          onClick={() => {
            // Trigger shoot event
            const event = new CustomEvent("mobile-shoot")
            window.dispatchEvent(event)
          }}
        >
          <Crosshair className="w-8 h-8 text-red-400" />
        </Button>
      </div>

      {/* Left Joystick - Movement */}
      <div
        ref={leftJoystickRef}
        className="absolute bottom-8 left-8 w-32 h-32 sm:w-40 sm:h-40 pointer-events-auto"
        onTouchStart={(e) => handleJoystickMove(e, leftJoystickRef, setLeftJoystick)}
        onTouchMove={(e) => handleJoystickMove(e, leftJoystickRef, setLeftJoystick)}
        onTouchEnd={() => handleJoystickEnd(setLeftJoystick)}
        onTouchCancel={() => handleJoystickEnd(setLeftJoystick)}
      >
        {/* Joystick base */}
        <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20">
          {/* Direction indicators */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white/40 text-xs font-bold">W</div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/40 text-xs font-bold">S</div>
          <div className="absolute left-2 top-1/2 -translate-y-1/2 text-white/40 text-xs font-bold">A</div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 text-xs font-bold">D</div>
        </div>
        {/* Joystick thumb */}
        <div
          className="absolute w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/30 backdrop-blur-md border-2 border-white/50 shadow-lg transition-transform duration-75"
          style={{
            left: `calc(50% - ${leftJoystick.active ? 28 : 28}px + ${leftJoystick.x * 40}px)`,
            top: `calc(50% - ${leftJoystick.active ? 28 : 28}px + ${leftJoystick.y * 40}px)`,
          }}
        />
      </div>

      {/* Right Joystick - Look/Rotation */}
      <div
        ref={rightJoystickRef}
        className="absolute bottom-8 right-8 w-32 h-32 sm:w-40 sm:h-40 pointer-events-auto"
        onTouchStart={(e) => handleJoystickMove(e, rightJoystickRef, setRightJoystick)}
        onTouchMove={(e) => handleJoystickMove(e, rightJoystickRef, setRightJoystick)}
        onTouchEnd={() => handleJoystickEnd(setRightJoystick)}
        onTouchCancel={() => handleJoystickEnd(setRightJoystick)}
      >
        {/* Joystick base */}
        <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20">
          {/* Rotation indicators */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 text-white/40 text-lg">&#8592;</div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 text-lg">&#8594;</div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/40 text-xs">LOOK</div>
        </div>
        {/* Joystick thumb */}
        <div
          className="absolute w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-500/30 backdrop-blur-md border-2 border-blue-400/50 shadow-lg transition-transform duration-75"
          style={{
            left: `calc(50% - 28px + ${rightJoystick.x * 40}px)`,
            top: `calc(50% - 28px + ${rightJoystick.y * 40}px)`,
          }}
        />
      </div>

      {/* Mobile instructions */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2">
        <p className="text-xs text-white/60 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
          Left: Move | Right: Look | Center: Shoot
        </p>
      </div>
    </div>
  )
}

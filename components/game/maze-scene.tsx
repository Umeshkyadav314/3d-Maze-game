"use client"

import { useRef, useEffect, useMemo, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Sky, PointerLockControls } from "@react-three/drei"
import * as THREE from "three"
import { useGame } from "@/contexts/game-context"

const CELL_SIZE = 4
const WALL_HEIGHT = 3
const WALL_THICKNESS = 0.2

function Floor({ width, height }: { width: number; height: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(width * CELL_SIZE) / 2, 0, (height * CELL_SIZE) / 2]}>
      <planeGeometry args={[width * CELL_SIZE, height * CELL_SIZE]} />
      <meshStandardMaterial color="#3d4852" roughness={0.8} />
    </mesh>
  )
}

function Ceiling({ width, height }: { width: number; height: number }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[(width * CELL_SIZE) / 2, WALL_HEIGHT, (height * CELL_SIZE) / 2]}>
      <planeGeometry args={[width * CELL_SIZE, height * CELL_SIZE]} />
      <meshStandardMaterial color="#1a202c" side={THREE.DoubleSide} />
    </mesh>
  )
}

function Wall({
  position,
  rotation,
  length,
}: { position: [number, number, number]; rotation: number; length: number }) {
  return (
    <mesh position={position} rotation={[0, rotation, 0]}>
      <boxGeometry args={[length, WALL_HEIGHT, WALL_THICKNESS]} />
      <meshStandardMaterial color="#5a6775" roughness={0.6} />
    </mesh>
  )
}

function Walls() {
  const { maze } = useGame()

  const walls = useMemo(() => {
    if (!maze) return []

    const wallsArray: { position: [number, number, number]; rotation: number; length: number }[] = []

    for (let x = 0; x < maze.width; x++) {
      for (let z = 0; z < maze.height; z++) {
        const cell = maze.cells[x][z]
        const posX = x * CELL_SIZE + CELL_SIZE / 2
        const posZ = z * CELL_SIZE + CELL_SIZE / 2

        if (cell.walls.north) {
          wallsArray.push({
            position: [posX, WALL_HEIGHT / 2, posZ - CELL_SIZE / 2],
            rotation: 0,
            length: CELL_SIZE,
          })
        }
        if (cell.walls.west) {
          wallsArray.push({
            position: [posX - CELL_SIZE / 2, WALL_HEIGHT / 2, posZ],
            rotation: Math.PI / 2,
            length: CELL_SIZE,
          })
        }
        if (z === maze.height - 1 && cell.walls.south) {
          wallsArray.push({
            position: [posX, WALL_HEIGHT / 2, posZ + CELL_SIZE / 2],
            rotation: 0,
            length: CELL_SIZE,
          })
        }
        if (x === maze.width - 1 && cell.walls.east) {
          wallsArray.push({
            position: [posX + CELL_SIZE / 2, WALL_HEIGHT / 2, posZ],
            rotation: Math.PI / 2,
            length: CELL_SIZE,
          })
        }
      }
    }

    return wallsArray
  }, [maze])

  return (
    <>
      {walls.map((wall, index) => (
        <Wall key={index} {...wall} />
      ))}
    </>
  )
}

function Goal() {
  const { maze } = useGame()
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.02
      meshRef.current.position.y = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.3
    }
  })

  if (!maze) return null

  const posX = maze.goal.x * CELL_SIZE + CELL_SIZE / 2
  const posZ = maze.goal.z * CELL_SIZE + CELL_SIZE / 2

  return (
    <group position={[posX, 0, posZ]}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#48bb78" emissive="#48bb78" emissiveIntensity={0.5} />
      </mesh>
      <pointLight color="#48bb78" intensity={2} distance={5} />
    </group>
  )
}

function Zombie({ position, id }: { position: { x: number; z: number }; id: string }) {
  const { playerPosition, takeDamage, shootZombie } = useGame()
  const meshRef = useRef<THREE.Mesh>(null)
  const posX = position.x * CELL_SIZE + CELL_SIZE / 2
  const posZ = position.z * CELL_SIZE + CELL_SIZE / 2
  const lastDamageTime = useRef(0)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01

      const playerPosX = playerPosition.x * CELL_SIZE
      const playerPosZ = playerPosition.z * CELL_SIZE
      const dist = Math.sqrt(Math.pow(posX - playerPosX, 2) + Math.pow(posZ - playerPosZ, 2))

      if (dist < 2 && state.clock.elapsedTime - lastDamageTime.current > 1) {
        takeDamage(10)
        lastDamageTime.current = state.clock.elapsedTime
      }
    }
  })

  return (
    <mesh ref={meshRef} position={[posX, 1, posZ]} onClick={() => shootZombie(id)}>
      <boxGeometry args={[0.8, 1.8, 0.4]} />
      <meshStandardMaterial color="#e53e3e" emissive="#c53030" emissiveIntensity={0.3} />
    </mesh>
  )
}

function Zombies() {
  const { zombies } = useGame()

  return (
    <>
      {zombies.map((zombie) => (
        <Zombie key={zombie.id} position={zombie} id={zombie.id} />
      ))}
    </>
  )
}

function Player() {
  const { playerPosition, playerRotation, movePlayer, rotatePlayer, autoMode, autoPath, gameState, setPlayerPosition } =
    useGame()
  const { camera, gl } = useThree()
  const keysPressed = useRef<Set<string>>(new Set())
  const autoPathIndex = useRef(0)
  const velocityRef = useRef({ x: 0, z: 0 })
  const rotationRef = useRef(0)
  const [isMobile, setIsMobile] = useState(false)
  const controlsRef = useRef<any>(null)

  // Detect mobile
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase())
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase())
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  // Reset auto path index when path changes
  useEffect(() => {
    autoPathIndex.current = 0
  }, [autoPath])

  useFrame((state, delta) => {
    if (gameState !== "playing") return

    const posX = playerPosition.x * CELL_SIZE
    const posZ = playerPosition.z * CELL_SIZE
    camera.position.set(posX, 1.6, posZ)

    // Smoothing factors
    const acceleration = 0.15
    const friction = 0.85
    const maxSpeed = 0.08
    const rotAcceleration = 0.1
    const rotFriction = 0.8

    if (autoMode && autoPath.length > 0) {
      const target = autoPath[autoPathIndex.current]
      if (target) {
        const targetX = target.x + 0.5
        const targetZ = target.z + 0.5
        const dx = targetX - playerPosition.x
        const dz = targetZ - playerPosition.z
        const dist = Math.sqrt(dx * dx + dz * dz)

        if (dist < 0.15) {
          autoPathIndex.current++
        } else {
          const speed = 0.04
          movePlayer((dx / dist) * speed, (dz / dist) * speed)
        }
      }
    } else if (!isMobile) {
      // Desktop keyboard controls with smooth acceleration
      let targetVelX = 0
      let targetVelZ = 0
      let targetRot = 0

      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)

      if (keysPressed.current.has("w") || keysPressed.current.has("arrowup")) {
        targetVelX += forward.x
        targetVelZ += forward.z
      }
      if (keysPressed.current.has("s") || keysPressed.current.has("arrowdown")) {
        targetVelX -= forward.x
        targetVelZ -= forward.z
      }
      if (keysPressed.current.has("a")) {
        targetVelX -= right.x
        targetVelZ -= right.z
      }
      if (keysPressed.current.has("d")) {
        targetVelX += right.x
        targetVelZ += right.z
      }
      if (keysPressed.current.has("arrowleft") || keysPressed.current.has("q")) {
        targetRot = 1
      }
      if (keysPressed.current.has("arrowright") || keysPressed.current.has("e")) {
        targetRot = -1
      }

      // Normalize diagonal movement
      const magnitude = Math.sqrt(targetVelX * targetVelX + targetVelZ * targetVelZ)
      if (magnitude > 0) {
        targetVelX = (targetVelX / magnitude) * maxSpeed
        targetVelZ = (targetVelZ / magnitude) * maxSpeed
      }

      // Apply acceleration and friction for smooth movement
      velocityRef.current.x = velocityRef.current.x * friction + targetVelX * acceleration
      velocityRef.current.z = velocityRef.current.z * friction + targetVelZ * acceleration
      rotationRef.current = rotationRef.current * rotFriction + targetRot * rotAcceleration

      // Apply movement
      if (Math.abs(velocityRef.current.x) > 0.001 || Math.abs(velocityRef.current.z) > 0.001) {
        movePlayer(velocityRef.current.x, velocityRef.current.z)
      }

      if (Math.abs(rotationRef.current) > 0.001) {
        rotatePlayer(rotationRef.current * 0.05)
      }
    }
  })

  return <>{!isMobile && <PointerLockControls ref={controlsRef} />}</>
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={0.6} />
      <hemisphereLight args={["#87CEEB", "#3d4852", 0.3]} />
    </>
  )
}

export default function MazeScene() {
  const { maze, gameState } = useGame()

  if (!maze || gameState === "menu") return null

  return (
    <div className="absolute inset-0 touch-none">
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 1000 }}
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
        onCreated={({ gl }) => {
          gl.setClearColor("#1a202c")
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        }}
      >
        <Lights />
        <Sky sunPosition={[100, 20, 100]} />
        <Floor width={maze.width} height={maze.height} />
        <Ceiling width={maze.width} height={maze.height} />
        <Walls />
        <Goal />
        <Zombies />
        <Player />
      </Canvas>
    </div>
  )
}

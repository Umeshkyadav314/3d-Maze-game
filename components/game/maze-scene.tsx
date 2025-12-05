"use client"

import { useRef, useEffect, useMemo, useState, useCallback } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Sky, PointerLockControls } from "@react-three/drei"
import * as THREE from "three"
import { useGame } from "@/contexts/game-context"

// Shooting raycast distance
const SHOOT_DISTANCE = 10

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
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (meshRef.current) {
      // Rotate the ball on Y axis
      meshRef.current.rotation.y += 0.02
      // Also rotate on X axis for more interesting rotation
      meshRef.current.rotation.x += 0.01
    }
    if (groupRef.current) {
      // Float up and down
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.3
    }
  })

  if (!maze) return null

  const posX = maze.goal.x * CELL_SIZE + CELL_SIZE / 2
  const posZ = maze.goal.z * CELL_SIZE + CELL_SIZE / 2

  return (
    <group ref={groupRef} position={[posX, 1, posZ]}>
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
    <mesh ref={meshRef} position={[posX, 1, posZ]} userData={{ zombieId: id }}>
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
  const { playerPosition, playerRotation, movePlayer, rotatePlayer, autoMode, autoPath, gameState, setPlayerPosition, shootZombie } =
    useGame()
  const { camera, gl, scene } = useThree()
  const keysPressed = useRef<Set<string>>(new Set())
  const autoPathIndex = useRef(0)
  const velocityRef = useRef({ x: 0, z: 0 })
  const rotationRef = useRef(0)
  const [isMobile, setIsMobile] = useState(false)
  const controlsRef = useRef<any>(null)
  const lastShotTime = useRef(0)
  const shootCooldown = 0.3 // 300ms cooldown between shots

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

  // Shooting function using raycasting
  const handleShoot = useCallback((currentTime: number) => {
    if (currentTime - lastShotTime.current < shootCooldown) return
    lastShotTime.current = currentTime

    // Create raycaster from camera center
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
    raycaster.far = SHOOT_DISTANCE // Maximum shooting distance

    // Get all zombies in the scene
    const zombies: THREE.Mesh[] = []
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.userData?.zombieId) {
        zombies.push(object)
      }
    })

    // Find closest zombie hit by raycast
    const intersects = raycaster.intersectObjects(zombies, false)
    if (intersects.length > 0 && intersects[0].distance <= SHOOT_DISTANCE) {
      const hitZombie = intersects[0].object as THREE.Mesh
      const zombieId = hitZombie.userData?.zombieId
      if (zombieId) {
        shootZombie(zombieId)
      }
    }
  }, [camera, scene, shootZombie])

  useEffect(() => {
    const normalizeKey = (key: string): string => {
      const lower = key.toLowerCase()
      // Normalize arrow keys
      if (lower === "arrowleft") return "arrowleft"
      if (lower === "arrowright") return "arrowright"
      if (lower === "arrowup") return "arrowup"
      if (lower === "arrowdown") return "arrowdown"
      return lower
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = normalizeKey(e.key)
      const gameKeys = ["w", "a", "s", "d", "q", "e", "arrowup", "arrowdown", "arrowleft", "arrowright", " "]
      
      if (gameKeys.includes(key)) {
        e.preventDefault()
        e.stopPropagation()
        keysPressed.current.add(key)
        
        // Handle shooting with spacebar
        if (key === " " && gameState === "playing") {
          handleShoot(performance.now() / 1000)
        }
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = normalizeKey(e.key)
      keysPressed.current.delete(key)
    }

    // Handle mouse click for shooting
    const handleMouseDown = (e: MouseEvent) => {
      if (gameState === "playing" && e.button === 0) { // Left mouse button
        handleShoot(performance.now() / 1000)
      }
    }

    // Use document with capture to ensure events are captured even with pointer lock
    document.addEventListener("keydown", handleKeyDown, { capture: true, passive: false })
    document.addEventListener("keyup", handleKeyUp, { capture: true })
    document.addEventListener("mousedown", handleMouseDown, { capture: true })

    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true })
      document.removeEventListener("keyup", handleKeyUp, { capture: true })
      document.removeEventListener("mousedown", handleMouseDown, { capture: true })
    }
  }, [gameState, handleShoot])

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
    const rotSpeed = 2.0 // Rotation speed in radians per second

    // Check if user is pressing any movement or rotation keys
    const hasMovementInput = keysPressed.current.has("w") || 
                              keysPressed.current.has("s") || 
                              keysPressed.current.has("a") || 
                              keysPressed.current.has("d") ||
                              keysPressed.current.has("arrowup") ||
                              keysPressed.current.has("arrowdown") ||
                              keysPressed.current.has("arrowleft") ||
                              keysPressed.current.has("arrowright")
    
    const hasRotationInput = keysPressed.current.has("q") ||
                             keysPressed.current.has("e")
    
    const isUserInput = hasMovementInput || hasRotationInput

    // Use auto mode only if enabled, has a path, AND user is not providing input
    // Manual controls always take priority when user presses keys
    if (autoMode && autoPath.length > 0 && !isUserInput && !isMobile) {
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
      let rotationDelta = 0

      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)

      // Movement keys
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

      // Rotation keys - apply directly to camera
      if (keysPressed.current.has("arrowleft") || keysPressed.current.has("q")) {
        rotationDelta = rotSpeed * delta
      }
      if (keysPressed.current.has("arrowright") || keysPressed.current.has("e")) {
        rotationDelta = -rotSpeed * delta
      }

      // Apply rotation directly to camera
      if (Math.abs(rotationDelta) > 0.001) {
        camera.rotateY(rotationDelta)
        // Also update the playerRotation state for consistency
        rotatePlayer(rotationDelta)
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

      // Apply movement
      if (Math.abs(velocityRef.current.x) > 0.001 || Math.abs(velocityRef.current.z) > 0.001) {
        movePlayer(velocityRef.current.x, velocityRef.current.z)
      }
    }
  })

  return (
    <>
      {!isMobile && (
        <PointerLockControls 
          ref={controlsRef}
          enabled={gameState === "playing"}
        />
      )}
    </>
  )
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
    <div className="absolute inset-0 touch-none" tabIndex={0}>
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 1000 }}
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
        onCreated={({ gl }) => {
          gl.setClearColor("#1a202c")
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        }}
        style={{ outline: 'none' }}
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

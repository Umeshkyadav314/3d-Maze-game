export type Cell = {
  x: number
  z: number
  walls: {
    north: boolean
    south: boolean
    east: boolean
    west: boolean
  }
  visited: boolean
}

export type Maze = {
  cells: Cell[][]
  width: number
  height: number
  start: { x: number; z: number }
  goal: { x: number; z: number }
}

// Recursive backtracking maze generation
export function generateMaze(width: number, height: number): Maze {
  // Initialize grid
  const cells: Cell[][] = []
  for (let x = 0; x < width; x++) {
    cells[x] = []
    for (let z = 0; z < height; z++) {
      cells[x][z] = {
        x,
        z,
        walls: { north: true, south: true, east: true, west: true },
        visited: false,
      }
    }
  }

  // Recursive backtracking
  const stack: Cell[] = []
  const startCell = cells[0][0]
  startCell.visited = true
  stack.push(startCell)

  while (stack.length > 0) {
    const current = stack[stack.length - 1]
    const neighbors = getUnvisitedNeighbors(cells, current, width, height)

    if (neighbors.length === 0) {
      stack.pop()
    } else {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)]
      removeWall(current, next)
      next.visited = true
      stack.push(next)
    }
  }

  return {
    cells,
    width,
    height,
    start: { x: 0, z: 0 },
    goal: { x: width - 1, z: height - 1 },
  }
}

function getUnvisitedNeighbors(cells: Cell[][], cell: Cell, width: number, height: number): Cell[] {
  const neighbors: Cell[] = []
  const { x, z } = cell

  if (x > 0 && !cells[x - 1][z].visited) neighbors.push(cells[x - 1][z])
  if (x < width - 1 && !cells[x + 1][z].visited) neighbors.push(cells[x + 1][z])
  if (z > 0 && !cells[x][z - 1].visited) neighbors.push(cells[x][z - 1])
  if (z < height - 1 && !cells[x][z + 1].visited) neighbors.push(cells[x][z + 1])

  return neighbors
}

function removeWall(current: Cell, next: Cell) {
  const dx = next.x - current.x
  const dz = next.z - current.z

  if (dx === 1) {
    current.walls.east = false
    next.walls.west = false
  } else if (dx === -1) {
    current.walls.west = false
    next.walls.east = false
  } else if (dz === 1) {
    current.walls.south = false
    next.walls.north = false
  } else if (dz === -1) {
    current.walls.north = false
    next.walls.south = false
  }
}

// A* Pathfinding for auto mode
export function findPath(
  maze: Maze,
  start: { x: number; z: number },
  goal: { x: number; z: number },
): { x: number; z: number }[] {
  const openSet: { x: number; z: number; g: number; h: number; f: number; parent: { x: number; z: number } | null }[] =
    []
  const closedSet = new Set<string>()

  const heuristic = (a: { x: number; z: number }, b: { x: number; z: number }) =>
    Math.abs(a.x - b.x) + Math.abs(a.z - b.z)

  openSet.push({
    ...start,
    g: 0,
    h: heuristic(start, goal),
    f: heuristic(start, goal),
    parent: null,
  })

  const cameFrom = new Map<string, { x: number; z: number } | null>()
  cameFrom.set(`${start.x},${start.z}`, null)

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f)
    const current = openSet.shift()!

    if (current.x === goal.x && current.z === goal.z) {
      // Reconstruct path
      const path: { x: number; z: number }[] = []
      let curr: { x: number; z: number } | null = current
      while (curr) {
        path.unshift({ x: curr.x, z: curr.z })
        curr = cameFrom.get(`${curr.x},${curr.z}`) || null
      }
      return path
    }

    closedSet.add(`${current.x},${current.z}`)

    const cell = maze.cells[current.x][current.z]
    const neighbors: { x: number; z: number }[] = []

    if (!cell.walls.north && current.z > 0) neighbors.push({ x: current.x, z: current.z - 1 })
    if (!cell.walls.south && current.z < maze.height - 1) neighbors.push({ x: current.x, z: current.z + 1 })
    if (!cell.walls.west && current.x > 0) neighbors.push({ x: current.x - 1, z: current.z })
    if (!cell.walls.east && current.x < maze.width - 1) neighbors.push({ x: current.x + 1, z: current.z })

    for (const neighbor of neighbors) {
      const key = `${neighbor.x},${neighbor.z}`
      if (closedSet.has(key)) continue

      const g = current.g + 1
      const h = heuristic(neighbor, goal)
      const f = g + h

      const existing = openSet.find((n) => n.x === neighbor.x && n.z === neighbor.z)
      if (!existing) {
        openSet.push({ ...neighbor, g, h, f, parent: current })
        cameFrom.set(key, { x: current.x, z: current.z })
      } else if (g < existing.g) {
        existing.g = g
        existing.f = f
        existing.parent = current
        cameFrom.set(key, { x: current.x, z: current.z })
      }
    }
  }

  return []
}

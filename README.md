# 3D Maze Game

A first-person 3D maze navigation game built with Next.js, React Three Fiber, and MongoDB.

## 📝 Project Overview

- **Type**: 3D First-Person Maze Game
- **Tech Stack**: Next.js 16, React 19, TypeScript, Three.js, Prisma, MongoDB
- **Features**: Procedural maze generation, zombie enemies, leaderboard, user authentication

## 🎮 Game Features

- **3D Maze Navigation**: First-person view with smooth controls
- **Procedural Generation**: Randomly generated mazes using recursive backtracking algorithm
- **Zombie Enemies**: Avoid or defeat zombies to survive
- **Level Progression**: Increasing difficulty with larger mazes
- **Auto Mode**: AI pathfinding to automatically navigate the maze
- **Leaderboard**: Track high scores and compete with other players
- **User Profiles**: Authentication with email/phone OTP and Google OAuth

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework
- **React Three Fiber** - 3D rendering
- **Three.js** - 3D graphics library
- **Tailwind CSS** - Styling
- **Radix UI** - UI components
- **Zod** - Form validation

### Backend
- **Next.js API Routes** - Server endpoints
- **Prisma** - ORM for MongoDB
- **MongoDB** - Database
- **Upstash Redis** - Session management
- **JWT** - Authentication tokens

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes (auth, scores, leaderboard)
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── leaderboard/       # Leaderboard page
│   └── profile/           # User profile page
├── components/
│   ├── game/             # Game components (HUD, controls, menus)
│   ├── auth/             # Authentication forms
│   └── ui/               # Reusable UI components
├── contexts/              # React contexts (game, user, theme)
├── lib/                   # Utilities
│   ├── maze-generator.ts  # Maze generation & pathfinding
│   ├── auth.ts           # Authentication logic
│   └── utils.ts          # Helper functions
└── prisma/
    └── schema.prisma      # Database schema
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB database
- Upstash Redis account (for sessions)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
DATABASE_URL="mongodb://..."
REDIS_URL="redis://..."
NEXTAUTH_SECRET="your-secret"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

3. Run Prisma migrations:
```bash
npx prisma generate
npx prisma db push
```

4. Start development server:
```bash
npm run dev
```

## 🎯 Game Mechanics

- **Maze Generation**: Recursive backtracking algorithm creates unique mazes
- **Movement**: WASD keys or arrow keys for desktop, touch controls for mobile
- **Scoring**: Time bonus + level bonus when completing a maze
- **Health System**: Take damage from zombies, game over at 0 health
- **Pathfinding**: A* algorithm for auto-navigation mode

## 🔐 Authentication

- Email/Phone registration with OTP verification
- Google OAuth integration
- Session-based authentication with Redis
- JWT tokens for API security

## 📊 Database Models

- **User**: User accounts and profiles
- **Score**: Game scores and statistics
- **GameSession**: Active game sessions
- **OTPVerification**: OTP codes for authentication
- **Account**: OAuth account linking

## 🎨 UI/UX Features

- Dark/Light theme support
- Responsive design (desktop & mobile)
- Smooth animations and transitions
- Mini-map for navigation
- Game HUD with health, score, and timer
- Pause menu and game over modals

## 📝 Notes

- Uses dynamic imports for 3D components to improve initial load
- Pointer lock controls for immersive desktop experience
- Mobile-optimized touch controls
- Procedural textures for walls and floors
- Real-time zombie AI and collision detection


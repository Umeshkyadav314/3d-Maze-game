import Header from "@/components/layout/header"
import LeaderboardTable from "@/components/leaderboard/leaderboard-table"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 max-w-2xl">
        <Link
          href="/"
          className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Game
        </Link>
        <LeaderboardTable />
      </main>
    </div>
  )
}

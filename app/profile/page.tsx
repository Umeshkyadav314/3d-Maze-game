import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import Header from "@/components/layout/header"
import ProfileCard from "@/components/profile/profile-card"
import UserStats from "@/components/profile/user-stats"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function ProfilePage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <Link
          href="/"
          className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Game
        </Link>
        <div className="flex flex-col items-center gap-6">
          <ProfileCard />
          <UserStats />
        </div>
      </main>
    </div>
  )
}

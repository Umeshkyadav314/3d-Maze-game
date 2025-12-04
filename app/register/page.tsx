import RegisterForm from "@/components/auth/register-form"
import Header from "@/components/layout/header"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container flex flex-col items-center justify-center min-h-[calc(100vh-56px)] py-8">
        <Link
          href="/"
          className="self-start mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Game
        </Link>
        <RegisterForm />
      </main>
    </div>
  )
}

"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Loader2, Mail, Phone, Chrome } from "lucide-react"
import Link from "next/link"

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser } = useUser()

  // Password login state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // OTP state
  const [otpIdentifier, setOtpIdentifier] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpType, setOtpType] = useState<"email" | "phone">("email")

  // General state
  const [error, setError] = useState(searchParams.get("error") || "")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("password")

  // Password login handler
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Login failed")
      }

      setUser(data.user)
      router.push("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  // Send OTP handler
  const handleSendOTP = async () => {
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: otpIdentifier, type: otpType }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP")
      }

      setOtpSent(true)
      // Show dev OTP in development
      if (data.devOtp) {
        console.log(`[DEV] OTP: ${data.devOtp}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP")
    } finally {
      setIsLoading(false)
    }
  }

  // Verify OTP handler
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: otpIdentifier, type: otpType, otp }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Verification failed")
      }

      setUser(data.user)
      router.push("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setIsLoading(false)
    }
  }

  // Google login handler
  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google"
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>Sign in to track your scores and compete on the leaderboard</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Google Login Button */}
        <Button variant="outline" className="w-full bg-transparent" onClick={handleGoogleLogin} disabled={isLoading}>
          <Chrome className="w-4 h-4 mr-2" />
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="email-otp">Email OTP</TabsTrigger>
            <TabsTrigger value="phone-otp">Phone OTP</TabsTrigger>
          </TabsList>

          {/* Password Login Tab */}
          <TabsContent value="password">
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Sign In
              </Button>
            </form>
          </TabsContent>

          {/* Email OTP Tab */}
          <TabsContent value="email-otp">
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp-email">Email Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="otp-email"
                    type="email"
                    placeholder="you@example.com"
                    value={otpType === "email" ? otpIdentifier : ""}
                    onChange={(e) => {
                      setOtpType("email")
                      setOtpIdentifier(e.target.value)
                      setOtpSent(false)
                    }}
                    required
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSendOTP}
                    disabled={isLoading || !otpIdentifier}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              {otpSent && otpType === "email" && (
                <div className="space-y-2">
                  <Label htmlFor="email-otp-code">Enter OTP</Label>
                  <Input
                    id="email-otp-code"
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Check your email for the 6-digit code</p>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading || !otpSent || otp.length !== 6}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Verify & Sign In
              </Button>
            </form>
          </TabsContent>

          {/* Phone OTP Tab */}
          <TabsContent value="phone-otp">
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp-phone">Phone Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="otp-phone"
                    type="tel"
                    placeholder="+919876543210"
                    maxLength={15}
                    pattern="^\+?[0-9]{10,15}$"
                    value={otpType === "phone" ? otpIdentifier : ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "")
                      setOtpType("phone")
                      setOtpIdentifier(value)
                      setOtpSent(false)
                    }}
                    required
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSendOTP}
                    disabled={isLoading || !otpIdentifier || otpIdentifier.replace(/\D/g, "").length < 10}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              {otpSent && otpType === "phone" && (
                <div className="space-y-2">
                  <Label htmlFor="phone-otp-code">Enter OTP</Label>
                  <Input
                    id="phone-otp-code"
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Check your phone for the 6-digit code</p>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading || !otpSent || otp.length !== 6}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Verify & Sign In
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

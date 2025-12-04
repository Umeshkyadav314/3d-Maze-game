"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
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

export default function RegisterForm() {
  const router = useRouter()
  const { setUser } = useUser()

  // Password registration state
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // OTP state
  const [otpIdentifier, setOtpIdentifier] = useState("")
  const [otpUsername, setOtpUsername] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpType, setOtpType] = useState<"email" | "phone">("email")

  // General state
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("password")

  // Password registration handler
  const handlePasswordRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Registration failed")
      }

      setUser(data.user)
      router.push("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
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

    if (!otpUsername.trim()) {
      setError("Please enter a username")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: otpIdentifier,
          type: otpType,
          otp,
          username: otpUsername,
        }),
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
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Join the maze challenge and compete for the top spot</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Google Sign Up Button */}
        <Button variant="outline" className="w-full bg-transparent" onClick={handleGoogleLogin} disabled={isLoading}>
          <Chrome className="w-4 h-4 mr-2" />
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or register with</span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="email-otp">Email OTP</TabsTrigger>
            <TabsTrigger value="phone-otp">Phone OTP</TabsTrigger>
          </TabsList>

          {/* Password Registration Tab */}
          <TabsContent value="password">
            <form onSubmit={handlePasswordRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="MazeRunner"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <Input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Account
              </Button>
            </form>
          </TabsContent>

          {/* Email OTP Registration Tab */}
          <TabsContent value="email-otp">
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp-reg-username">Username</Label>
                <Input
                  id="otp-reg-username"
                  placeholder="MazeRunner"
                  value={otpUsername}
                  onChange={(e) => setOtpUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otp-reg-email">Email Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="otp-reg-email"
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
                  <Label htmlFor="email-reg-otp-code">Enter OTP</Label>
                  <Input
                    id="email-reg-otp-code"
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
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !otpSent || otp.length !== 6 || !otpUsername}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Verify & Create Account
              </Button>
            </form>
          </TabsContent>

          {/* Phone OTP Registration Tab */}
          <TabsContent value="phone-otp">
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone-reg-username">Username</Label>
                <Input
                  id="phone-reg-username"
                  placeholder="MazeRunner"
                  value={otpUsername}
                  onChange={(e) => setOtpUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otp-reg-phone">Phone Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="otp-reg-phone"
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
                <p className="text-xs text-muted-foreground">Enter 10-15 digit phone number with country code</p>
              </div>
              {otpSent && otpType === "phone" && (
                <div className="space-y-2">
                  <Label htmlFor="phone-reg-otp-code">Enter OTP</Label>
                  <Input
                    id="phone-reg-otp-code"
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
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !otpSent || otp.length !== 6 || !otpUsername}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Verify & Create Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

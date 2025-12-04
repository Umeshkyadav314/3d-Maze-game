import { type NextRequest, NextResponse } from "next/server"
import { storeOTP, checkRateLimit } from "@/lib/otp"
import { sendEmailOTP } from "@/lib/email"
import { sendSMSOTP } from "@/lib/sms"

export async function POST(request: NextRequest) {
  try {
    const { identifier, type } = await request.json()

    if (!identifier || !type) {
      return NextResponse.json({ error: "Identifier and type are required" }, { status: 400 })
    }

    if (type !== "email" && type !== "phone") {
      return NextResponse.json({ error: "Type must be 'email' or 'phone'" }, { status: 400 })
    }

    // Validate format
    if (type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(identifier)) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
      }
    } else {
      const phoneRegex = /^\+?[1-9]\d{9,14}$/
      if (!phoneRegex.test(identifier.replace(/\s/g, ""))) {
        return NextResponse.json({ error: "Invalid phone format" }, { status: 400 })
      }
    }

    // Check rate limit
    const canSend = await checkRateLimit(identifier, type)
    if (!canSend) {
      return NextResponse.json({ error: "Too many OTP requests. Please try again later." }, { status: 429 })
    }

    // Generate and store OTP
    const otp = await storeOTP(identifier, type)

    // Send OTP
    let sent = false
    if (type === "email") {
      sent = await sendEmailOTP(identifier, otp)
    } else {
      sent = await sendSMSOTP(identifier, otp)
    }

    if (!sent) {
      return NextResponse.json({ error: `Failed to send OTP via ${type}` }, { status: 500 })
    }

    return NextResponse.json({
      message: `OTP sent to ${type === "email" ? "email" : "phone"}`,
      // Only include OTP in development mode for testing
      ...(process.env.NODE_ENV === "development" && { devOtp: otp }),
    })
  } catch (error) {
    console.error("Send OTP error:", error)
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 })
  }
}

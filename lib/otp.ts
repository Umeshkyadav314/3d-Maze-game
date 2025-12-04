import { redis } from "./redis"

const OTP_EXPIRY = 300 // 5 minutes
const OTP_LENGTH = 6

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function storeOTP(identifier: string, type: "email" | "phone"): Promise<string> {
  const otp = generateOTP()
  const key = `otp:${type}:${identifier}`

  // Store OTP with expiry
  await redis.set(key, otp, { ex: OTP_EXPIRY })

  // Store attempt count for rate limiting
  const attemptKey = `otp:attempts:${type}:${identifier}`
  const attempts = await redis.incr(attemptKey)
  if (attempts === 1) {
    await redis.expire(attemptKey, 3600) // Reset after 1 hour
  }

  return otp
}

export async function verifyOTP(identifier: string, type: "email" | "phone", otp: string): Promise<boolean> {
  const key = `otp:${type}:${identifier}`
  const storedOTP = await redis.get(key)

  if (!storedOTP || storedOTP !== otp) {
    return false
  }

  // Delete OTP after successful verification
  await redis.del(key)
  return true
}

export async function checkRateLimit(identifier: string, type: "email" | "phone"): Promise<boolean> {
  const attemptKey = `otp:attempts:${type}:${identifier}`
  const attempts = await redis.get(attemptKey)

  // Allow max 5 OTP requests per hour
  return !attempts || Number(attempts) < 5
}

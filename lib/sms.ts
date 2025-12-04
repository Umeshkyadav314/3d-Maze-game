// SMS service for sending OTP
export async function sendSMSOTP(phone: string, otp: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !twilioPhone) {
    console.log(`[DEV MODE] SMS OTP for ${phone}: ${otp}`)
    return true
  }

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
      },
      body: new URLSearchParams({
        From: twilioPhone,
        To: phone,
        Body: `Your Maze Navigator verification code is: ${otp}. Valid for 5 minutes.`,
      }),
    })

    return response.ok
  } catch (error) {
    console.error("Failed to send SMS:", error)
    return false
  }
}

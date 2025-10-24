import { NextResponse } from "next/server"

export const dynamic = "force-static"
export const revalidate = false

export async function GET() {
  const healthData = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: "production",
  }

  return NextResponse.json(healthData, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=60",
      "Content-Type": "application/json",
    },
  })
}

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    version: 'v1.1.0-with-points',
    commitInfo: 'Points system deployed'
  })
}
import { NextResponse } from 'next/server'

export function GET() {
  const clientId = process.env.NAVER_CLIENT_ID || ''
  return NextResponse.json({ clientId })
}

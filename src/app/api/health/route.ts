import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // You can add database health check here if needed
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString() 
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Health check failed' },
      { status: 500 }
    )
  }
}
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { initializeAllClientStats } from '@/lib/stats-manager'

// One-time initialization endpoint for ClientStats table
// Call this once after deployment to populate stats for existing clients
export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    // Only admins can initialize stats
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
    }

    await initializeAllClientStats()

    return NextResponse.json({ success: true, message: 'Stats initialized for all clients' })
  } catch (error) {
    console.error('Error initializing stats:', error)
    return NextResponse.json({ error: 'Failed to initialize stats' }, { status: 500 })
  }
}

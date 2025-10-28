import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET endpoint to fetch profile picture separately (not in session/JWT)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ profilePicture: null })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profilePicture: true }
    })

    return NextResponse.json({
      profilePicture: user?.profilePicture || null
    })
  } catch (error) {
    console.error('[Profile Picture Get] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile picture' },
      { status: 500 }
    )
  }
}

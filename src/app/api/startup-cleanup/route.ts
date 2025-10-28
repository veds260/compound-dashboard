import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// This endpoint runs the cleanup without requiring authentication
// Call it once after deployment to fix the database
export async function GET() {
  try {
    console.log('🔍 [Startup Cleanup] Checking for oversized profile pictures...')

    const users = await prisma.user.findMany({
      where: {
        profilePicture: {
          not: null
        }
      },
      select: {
        id: true,
        email: true,
        profilePicture: true
      }
    })

    console.log(`[Startup Cleanup] Found ${users.length} users with profile pictures`)

    let fixedCount = 0
    const results = []

    for (const user of users) {
      if (user.profilePicture) {
        const size = user.profilePicture.length
        console.log(`[Startup Cleanup] User ${user.email}: ${size} bytes`)

        // If profile picture is larger than 200KB, remove it
        if (size > 200000) {
          console.log(`[Startup Cleanup] ⚠️  Too large! Removing...`)
          await prisma.user.update({
            where: { id: user.id },
            data: { profilePicture: null }
          })
          fixedCount++
          results.push({ email: user.email, size, action: 'removed' })
        } else {
          results.push({ email: user.email, size, action: 'kept' })
        }
      }
    }

    console.log(`[Startup Cleanup] ✅ Fixed ${fixedCount} users with oversized profile pictures`)

    return NextResponse.json({
      success: true,
      message: `Cleanup complete. Fixed ${fixedCount} out of ${users.length} users.`,
      totalUsers: users.length,
      fixedCount,
      results
    })
  } catch (error) {
    console.error('[Startup Cleanup] ❌ Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Cleanup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

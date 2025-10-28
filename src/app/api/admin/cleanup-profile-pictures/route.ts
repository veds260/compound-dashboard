import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    console.log('🔍 Starting profile picture cleanup...')

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

    console.log(`Found ${users.length} users with profile pictures`)

    let fixedCount = 0
    const results = []

    for (const user of users) {
      if (user.profilePicture) {
        const size = user.profilePicture.length
        console.log(`User ${user.email}: ${size} bytes`)

        // If profile picture is larger than 200KB, remove it
        if (size > 200000) {
          console.log(`  ⚠️  Too large! Removing...`)
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

    console.log(`\n✅ Fixed ${fixedCount} users with oversized profile pictures`)

    return NextResponse.json({
      success: true,
      totalUsers: users.length,
      fixedCount,
      results
    })
  } catch (error) {
    console.error('❌ Cleanup error:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup profile pictures', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

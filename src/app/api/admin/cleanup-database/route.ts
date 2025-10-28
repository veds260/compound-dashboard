import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body

    console.log('[Cleanup] Starting cleanup action:', action)

    let message = ''

    switch (action) {
      case 'DELETE_ALL_POSTS':
        const deletedPosts = await prisma.post.deleteMany({})
        message = `Deleted ${deletedPosts.count} posts`
        break

      case 'DELETE_ALL_USERS':
        const deletedUsers = await prisma.user.deleteMany({
          where: {
            email: {
              not: 'compoundops@gmail.com'
            }
          }
        })
        message = `Deleted ${deletedUsers.count} users (kept admin)`
        break

      case 'DELETE_ALL_CLIENTS':
        const deletedClients = await prisma.client.deleteMany({})
        message = `Deleted ${deletedClients.count} clients and associated data`
        break

      case 'FULL_RESET':
        console.log('[Cleanup] Starting full database reset...')

        await prisma.contentDump.deleteMany({})
        console.log('[Cleanup] Cleared content dumps')

        await prisma.followerAnalytics.deleteMany({})
        console.log('[Cleanup] Cleared follower analytics')

        await prisma.tweetAnalytics.deleteMany({})
        console.log('[Cleanup] Cleared tweet analytics')

        await prisma.analytics.deleteMany({})
        console.log('[Cleanup] Cleared analytics')

        await prisma.post.deleteMany({})
        console.log('[Cleanup] Cleared posts')

        await prisma.upload.deleteMany({})
        console.log('[Cleanup] Cleared uploads')

        await prisma.client.deleteMany({})
        console.log('[Cleanup] Cleared clients')

        const deletedNonAdminUsers = await prisma.user.deleteMany({
          where: {
            email: {
              not: 'compoundops@gmail.com'
            }
          }
        })
        console.log(`[Cleanup] Cleared ${deletedNonAdminUsers.count} non-admin users`)

        message = 'Full database reset complete. Admin user preserved: compoundops@gmail.com'
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    console.log('[Cleanup]', message)

    return NextResponse.json({
      success: true,
      message
    })
  } catch (error) {
    console.error('[Cleanup] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cleanup database' },
      { status: 500 }
    )
  }
}

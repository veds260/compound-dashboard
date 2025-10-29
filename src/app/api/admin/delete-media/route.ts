import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, postId } = await request.json()

    let result

    switch (action) {
      case 'DELETE_POST_MEDIA':
        if (!postId) {
          return NextResponse.json({ error: 'Post ID required' }, { status: 400 })
        }

        result = await prisma.post.update({
          where: { id: postId },
          data: { media: null }
        })

        return NextResponse.json({
          message: 'Media removed from post successfully',
          postId: result.id
        })

      case 'DELETE_RECENT_MEDIA':
        // Delete media from posts updated in the last 24 hours
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)

        const recentUpdate = await prisma.post.updateMany({
          where: {
            media: { not: null },
            updatedAt: { gte: yesterday }
          },
          data: { media: null }
        })

        return NextResponse.json({
          message: `Removed media from ${recentUpdate.count} recent posts`,
          count: recentUpdate.count
        })

      case 'DELETE_ALL_MEDIA':
        // Delete all media from all posts
        const allUpdate = await prisma.post.updateMany({
          where: {
            media: { not: null }
          },
          data: { media: null }
        })

        return NextResponse.json({
          message: `Removed all media from ${allUpdate.count} posts`,
          count: allUpdate.count
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error deleting media:', error)
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all posts with media
    const postsWithMedia = await prisma.post.findMany({
      where: {
        media: {
          not: null
        }
      },
      select: {
        id: true,
        content: true,
        media: true,
        updatedAt: true,
        client: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Calculate stats
    const stats = postsWithMedia.map(post => {
      const mediaArray = post.media ? JSON.parse(post.media) : []
      const mediaCount = mediaArray.length
      const mediaSize = post.media ? post.media.length : 0 // Size in bytes (base64 string length)

      return {
        id: post.id,
        content: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
        mediaCount,
        mediaSize,
        updatedAt: post.updatedAt.toISOString(),
        client: {
          name: post.client.name
        }
      }
    })

    const totalPosts = stats.length
    const totalSize = stats.reduce((sum, post) => sum + post.mediaSize, 0)

    return NextResponse.json({
      posts: stats,
      totalPosts,
      totalSize
    })
  } catch (error) {
    console.error('Error fetching media stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media statistics' },
      { status: 500 }
    )
  }
}

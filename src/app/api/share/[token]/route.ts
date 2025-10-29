import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/share/[token] - Get post by share token
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    const post = await prisma.post.findUnique({
      where: { shareToken: token },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            twitterHandle: true,
            profilePicture: true
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error fetching shared post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

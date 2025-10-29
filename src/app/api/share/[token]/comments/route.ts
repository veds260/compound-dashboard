import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/share/[token]/comments - Get comments for shared post
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    // Find post by share token
    const post = await prisma.post.findUnique({
      where: { shareToken: token }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const comments = await prisma.comment.findMany({
      where: { postId: post.id },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/share/[token]/comments - Add comment via share link (anonymous)
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const body = await request.json()
    const { commentText, selectedText, startOffset, endOffset, guestName } = body

    if (!commentText || !selectedText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!guestName || !guestName.trim()) {
      return NextResponse.json({ error: 'Guest name is required' }, { status: 400 })
    }

    // Find post by share token
    const post = await prisma.post.findUnique({
      where: { shareToken: token },
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Create comment as guest user
    const comment = await prisma.comment.create({
      data: {
        postId: post.id,
        userId: post.client.id, // Use client ID as user ID
        userName: guestName.trim(), // Use provided guest name
        userRole: 'CLIENT', // Mark as client comment
        commentText,
        selectedText,
        startOffset,
        endOffset
      }
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

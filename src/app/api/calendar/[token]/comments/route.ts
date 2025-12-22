import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/calendar/[token]/comments - Add a comment from shared calendar
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const { postId, commentText, guestName } = await request.json()

    if (!postId || !commentText) {
      return NextResponse.json(
        { error: 'Post ID and comment text are required' },
        { status: 400 }
      )
    }

    // Verify the token is valid
    const client = await prisma.client.findUnique({
      where: { calendarShareToken: token },
      select: { id: true, name: true }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Invalid or expired calendar link' },
        { status: 404 }
      )
    }

    // Verify the post belongs to this client
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        clientId: client.id
      }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Create the comment as a guest
    const comment = await prisma.comment.create({
      data: {
        postId,
        userId: 'guest', // Guest user identifier
        userName: guestName || `${client.name} (via shared link)`,
        userRole: 'CLIENT', // Treat as client comment
        commentText,
        selectedText: '', // No text selection for simple comments
        startOffset: 0,
        endOffset: 0
      }
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error creating comment from shared calendar:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}

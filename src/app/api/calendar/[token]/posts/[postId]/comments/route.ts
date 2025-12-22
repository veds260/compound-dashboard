import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/calendar/[token]/posts/[postId]/comments - Get comments for a post via calendar share
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string; postId: string } }
) {
  try {
    const { token, postId } = params

    // Verify the calendar share token is valid
    const client = await prisma.client.findUnique({
      where: { calendarShareToken: token },
      select: { id: true }
    })

    if (!client) {
      return NextResponse.json({ error: 'Invalid calendar link' }, { status: 404 })
    }

    // Verify the post belongs to this client
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        clientId: client.id
      }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/calendar/[token]/posts/[postId]/comments - Add comment via calendar share link
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string; postId: string } }
) {
  try {
    const { token, postId } = params
    const body = await request.json()
    const { commentText, selectedText, startOffset, endOffset, guestName } = body

    if (!commentText || !selectedText) {
      return NextResponse.json({ error: 'Comment text and selected text are required' }, { status: 400 })
    }

    if (!guestName || !guestName.trim()) {
      return NextResponse.json({ error: 'Your name is required' }, { status: 400 })
    }

    // Verify the calendar share token is valid
    const client = await prisma.client.findUnique({
      where: { calendarShareToken: token },
      select: { id: true, name: true }
    })

    if (!client) {
      return NextResponse.json({ error: 'Invalid calendar link' }, { status: 404 })
    }

    // Verify the post belongs to this client
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        clientId: client.id
      }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Create comment as guest user
    const comment = await prisma.comment.create({
      data: {
        postId,
        userId: client.id, // Use client ID as user ID
        userName: guestName.trim(),
        userRole: 'CLIENT',
        commentText,
        selectedText,
        startOffset: startOffset || 0,
        endOffset: endOffset || 0
      }
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

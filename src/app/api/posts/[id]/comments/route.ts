import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Role } from '@prisma/client'

// GET all comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const postId = params.id

    // Verify user has access to this post
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { client: true }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check authorization
    const isAgency = session.user.role === 'AGENCY' && post.client.agencyId === session.user.id
    const isClient = session.user.role === 'CLIENT' && post.clientId === session.user.clientId
    const isAdmin = session.user.role === 'ADMIN'

    if (!isAgency && !isClient && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const postId = params.id
    const { commentText, selectedText, startOffset, endOffset } = await request.json()

    if (!commentText || !selectedText || startOffset === undefined || endOffset === undefined) {
      return NextResponse.json(
        { error: 'Comment text, selected text, and offsets are required' },
        { status: 400 }
      )
    }

    // Verify user has access to this post
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { client: true }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check authorization
    const isAgency = session.user.role === 'AGENCY' && post.client.agencyId === session.user.id
    const isClient = session.user.role === 'CLIENT' && post.clientId === session.user.clientId
    const isAdmin = session.user.role === 'ADMIN'

    if (!isAgency && !isClient && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        userId: session.user.id,
        userName: session.user.name || session.user.email,
        userRole: session.user.role as Role,
        commentText,
        selectedText,
        startOffset,
        endOffset
      }
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}

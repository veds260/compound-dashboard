import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PUT /api/posts/[id]/add-writer-note - Add a writer note to post feedback
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'AGENCY' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized. Agency or Admin access required.' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { note } = body

    if (!note || note.trim() === '') {
      return NextResponse.json(
        { error: 'Note cannot be empty' },
        { status: 400 }
      )
    }

    // Get the post
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        client: true
      }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Verify the post belongs to this agency's client (skip check for admins)
    if (session.user.role === 'AGENCY' && post.client.agencyId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized. This post belongs to another agency.' },
        { status: 403 }
      )
    }

    // Append writer note to feedback
    const timestamp = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    const writerNote = `\n\n[Writer Note - ${timestamp}]: ${note.trim()}`
    const updatedFeedback = (post.feedback || '') + writerNote

    // Update post feedback
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        feedback: updatedFeedback
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Note added successfully',
      post: updatedPost
    })
  } catch (error) {
    console.error('Error adding writer note:', error)
    return NextResponse.json(
      { error: 'Failed to add note' },
      { status: 500 }
    )
  }
}

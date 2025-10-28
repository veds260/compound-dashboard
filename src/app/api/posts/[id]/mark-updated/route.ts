import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PUT /api/posts/[id]/mark-updated - Mark post as updated after changes (SUGGEST_CHANGES → PENDING)
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

    // Only allow if post is in SUGGEST_CHANGES status
    if (post.status !== 'SUGGEST_CHANGES') {
      return NextResponse.json(
        { error: 'Post must be in SUGGEST_CHANGES status to mark as updated' },
        { status: 400 }
      )
    }

    // Append update note to feedback
    const timestamp = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    const updateNote = `\n\n✓ Changes completed by writer on ${timestamp}`
    const updatedFeedback = (post.feedback || '') + updateNote

    // Update post status to PENDING
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        status: 'PENDING',
        feedback: updatedFeedback
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Post marked as updated and sent back for review',
      post: updatedPost
    })
  } catch (error) {
    console.error('Error marking post as updated:', error)
    return NextResponse.json(
      { error: 'Failed to mark post as updated' },
      { status: 500 }
    )
  }
}

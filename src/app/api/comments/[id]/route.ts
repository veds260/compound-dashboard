import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PUT update a comment (toggle resolved status)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const { resolved } = await request.json()

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        post: {
          include: { client: true }
        }
      }
    })

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Check authorization - only comment author or agency can update
    const isAuthor = comment.userId === session.user.id
    const isAgency = session.user.role === 'AGENCY' && comment.post.client.agencyId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isAuthor && !isAgency && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { resolved: resolved ?? !comment.resolved }
    })

    return NextResponse.json(updatedComment)
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    )
  }
}

// DELETE a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        post: {
          include: { client: true }
        }
      }
    })

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Check authorization - only comment author or agency can delete
    const isAuthor = comment.userId === session.user.id
    const isAgency = session.user.role === 'AGENCY' && comment.post.client.agencyId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isAuthor && !isAgency && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.comment.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}

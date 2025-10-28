import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// DELETE /api/uploads/[id] - Undo an upload (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { id } = params

    // Get the upload to verify it exists
    const upload = await prisma.upload.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            name: true
          }
        }
      }
    })

    if (!upload) {
      return NextResponse.json(
        { error: 'Upload not found' },
        { status: 404 }
      )
    }

    // Try to delete posts associated with this upload
    // This will only work if migration has been applied
    let deletedPosts = { count: 0 }
    try {
      deletedPosts = await prisma.post.deleteMany({
        where: {
          uploadId: id
        }
      })
    } catch (error: any) {
      console.log('uploadId field not available yet, cannot delete associated posts')
      // If the field doesn't exist, we can still delete the upload record
    }

    // Delete the upload record
    await prisma.upload.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: deletedPosts.count > 0
        ? `Upload undone successfully. Deleted ${deletedPosts.count} posts.`
        : 'Upload deleted. Note: Cannot delete associated posts until migration is applied.',
      deletedPosts: deletedPosts.count,
      clientName: upload.client.name
    })
  } catch (error: any) {
    console.error('Error undoing upload:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
    return NextResponse.json(
      {
        error: 'Failed to undo upload',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    )
  }
}

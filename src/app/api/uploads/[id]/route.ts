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
            name: true,
            id: true
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

    // Find the previous upload for this client (by date, before current upload)
    const previousUpload = await prisma.upload.findFirst({
      where: {
        clientId: upload.clientId,
        uploadDate: {
          lt: upload.uploadDate
        }
      },
      orderBy: {
        uploadDate: 'desc'
      }
    })

    console.log(`[Undo Upload] Current upload: ${id}, Previous upload: ${previousUpload?.id || 'none'}`)

    let restoredCount = 0
    let deletedCount = 0

    if (previousUpload) {
      // Strategy: Use creation dates to determine which posts are new vs existing
      // Posts created AFTER previous upload are NEW (delete them)
      // Posts created BEFORE or AT previous upload are EXISTING (restore them)

      // Get ALL posts for this client
      const allClientPosts = await prisma.post.findMany({
        where: {
          clientId: upload.clientId
        },
        select: {
          id: true,
          typefullyUrl: true,
          createdAt: true,
          uploadId: true
        }
      })

      console.log(`[Undo Upload] Found ${allClientPosts.length} total posts for client`)
      console.log(`[Undo Upload] Previous upload date: ${previousUpload.uploadDate}`)
      console.log(`[Undo Upload] Current upload date: ${upload.uploadDate}`)

      for (const post of allClientPosts) {
        // Check if post was created AFTER the previous upload (meaning it's new from current upload)
        if (post.createdAt > previousUpload.uploadDate) {
          // This is a NEW post from current upload, delete it
          console.log(`[Undo Upload] Deleting new post created at ${post.createdAt}: ${post.typefullyUrl.substring(0, 50)}`)
          await prisma.post.delete({
            where: { id: post.id }
          })
          deletedCount++
        } else if (post.uploadId === id) {
          // This is an EXISTING post that was updated in current upload
          // Restore its uploadId back to previous upload
          console.log(`[Undo Upload] Restoring existing post created at ${post.createdAt}: ${post.typefullyUrl.substring(0, 50)}`)
          await prisma.post.update({
            where: { id: post.id },
            data: { uploadId: previousUpload.id }
          })
          restoredCount++
        }
        // If post.uploadId !== id and createdAt <= previousUpload.uploadDate, leave it alone
        // (it's from an even older upload)
      }

      console.log(`[Undo Upload] Restored ${restoredCount} posts to previous upload, deleted ${deletedCount} new posts`)
    } else {
      // No previous upload, delete all posts for this client
      const result = await prisma.post.deleteMany({
        where: {
          clientId: upload.clientId
        }
      })
      deletedCount = result.count
      console.log(`[Undo Upload] No previous upload found, deleted all ${deletedCount} posts`)
    }

    // Delete the upload record
    await prisma.upload.delete({
      where: { id }
    })

    const message = previousUpload
      ? `Upload undone successfully. Restored ${restoredCount} posts to previous state and removed ${deletedCount} new posts.`
      : `Upload undone successfully. Deleted ${deletedCount} posts (no previous upload to restore).`

    return NextResponse.json({
      success: true,
      message,
      restoredCount,
      deletedCount,
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

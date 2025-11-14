import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST - Add media to post
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'AGENCY' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const tweetIndexStr = formData.get('tweetIndex') as string | null

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Get the post
    const post = await prisma.post.findUnique({
      where: { id: params.id }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Parse existing media
    const existingMedia = post.media ? JSON.parse(post.media) : []

    // Determine which tweet this media belongs to (default to 0 for backward compatibility)
    const tweetIndex = tweetIndexStr !== null ? parseInt(tweetIndexStr, 10) : 0

    // Check if adding these files would exceed the limit
    if (existingMedia.length + files.length > 4) {
      return NextResponse.json(
        { error: `Cannot add ${files.length} file(s). Maximum 4 media items per post. Currently have ${existingMedia.length}.` },
        { status: 400 }
      )
    }

    const newMedia = []

    for (const file of files) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Only JPEG, PNG, WebP, and GIF are allowed.` },
          { status: 400 }
        )
      }

      // Validate file size (3MB limit)
      const maxSize = 3 * 1024 * 1024 // 3MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Maximum size is 3MB.` },
          { status: 400 }
        )
      }

      // Convert file to base64
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = buffer.toString('base64')
      const dataUrl = `data:${file.type};base64,${base64}`

      // Check final data URL size (base64 encoding increases size by ~33%)
      // Max 3MB original = ~4MB base64, so we allow up to 5MB to be safe
      const maxBase64Size = 5 * 1024 * 1024 // 5MB
      if (dataUrl.length > maxBase64Size) {
        return NextResponse.json(
          { error: `Compressed image is still too large: ${file.name}. Please use a smaller image.` },
          { status: 400 }
        )
      }

      newMedia.push({
        type: 'image',
        data: dataUrl,
        name: file.name,
        tweetIndex: tweetIndex // Add tweet index to media item
      })
    }

    // Combine existing and new media
    const updatedMedia = [...existingMedia, ...newMedia]

    // Update post with new media
    const updatedPost = await prisma.post.update({
      where: { id: params.id },
      data: { media: JSON.stringify(updatedMedia) }
    })

    console.log(`[Media Upload] Added ${newMedia.length} media item(s) to post ${params.id}, tweet index: ${tweetIndex}`)

    return NextResponse.json({
      success: true,
      media: updatedMedia,
      count: updatedMedia.length
    })
  } catch (error) {
    console.error('Media upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    )
  }
}

// DELETE - Remove specific media item by index
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'AGENCY' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const indexStr = searchParams.get('index')

    if (indexStr === null) {
      return NextResponse.json({ error: 'Media index required' }, { status: 400 })
    }

    const index = parseInt(indexStr, 10)

    // Get the post
    const post = await prisma.post.findUnique({
      where: { id: params.id }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Parse existing media
    const existingMedia = post.media ? JSON.parse(post.media) : []

    if (index < 0 || index >= existingMedia.length) {
      return NextResponse.json({ error: 'Invalid media index' }, { status: 400 })
    }

    // Remove the media at the specified index
    existingMedia.splice(index, 1)

    // Update post
    await prisma.post.update({
      where: { id: params.id },
      data: { media: existingMedia.length > 0 ? JSON.stringify(existingMedia) : null }
    })

    console.log(`[Media Delete] Removed media item ${index} from post ${params.id}`)

    return NextResponse.json({
      success: true,
      media: existingMedia,
      count: existingMedia.length
    })
  } catch (error) {
    console.error('Media delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2MB.' },
        { status: 400 }
      )
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Check final data URL size (should be under 200KB for JWT compatibility)
    if (dataUrl.length > 200000) {
      return NextResponse.json(
        { error: 'Compressed image is still too large. Please use a smaller image.' },
        { status: 400 }
      )
    }

    // Update user's profile picture
    await prisma.user.update({
      where: { id: session.user.id },
      data: { profilePicture: dataUrl }
    })

    // If user is a CLIENT, also update their Client.profilePicture
    if (session.user.role === 'CLIENT' && session.user.clientId) {
      await prisma.client.update({
        where: { id: session.user.clientId },
        data: { profilePicture: dataUrl }
      })
      console.log(`[Profile Picture] Also updated Client ${session.user.clientId}`)
    }

    console.log(`[Profile Picture] Updated for user ${session.user.id}, size: ${dataUrl.length} bytes`)

    return NextResponse.json({
      success: true,
      profilePicture: dataUrl
    })
  } catch (error) {
    console.error('Profile picture upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload profile picture' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Remove user's profile picture
    await prisma.user.update({
      where: { id: session.user.id },
      data: { profilePicture: null }
    })

    // If user is a CLIENT, also remove their Client.profilePicture
    if (session.user.role === 'CLIENT' && session.user.clientId) {
      await prisma.client.update({
        where: { id: session.user.clientId },
        data: { profilePicture: null }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Profile picture delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete profile picture' },
      { status: 500 }
    )
  }
}

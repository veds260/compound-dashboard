import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { randomBytes } from 'crypto'

// POST /api/clients/[id]/calendar-share - Generate calendar share link
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'AGENCY' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if client exists and user has access
    const client = await prisma.client.findUnique({
      where: { id }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Check authorization
    if (session.user.role === 'AGENCY' && client.agencyId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // If calendar share token already exists, return it
    if (client.calendarShareToken) {
      const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/calendar/share/${client.calendarShareToken}`
      return NextResponse.json({
        calendarShareToken: client.calendarShareToken,
        shareUrl
      })
    }

    // Generate new calendar share token
    const calendarShareToken = randomBytes(16).toString('hex')

    // Update client with calendar share token
    const updatedClient = await prisma.client.update({
      where: { id },
      data: { calendarShareToken }
    })

    const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/calendar/share/${calendarShareToken}`

    return NextResponse.json({
      calendarShareToken: updatedClient.calendarShareToken,
      shareUrl
    })
  } catch (error) {
    console.error('Error generating calendar share link:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/clients/[id]/calendar-share - Revoke calendar share link
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'AGENCY' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if client exists and user has access
    const client = await prisma.client.findUnique({
      where: { id }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Check authorization
    if (session.user.role === 'AGENCY' && client.agencyId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Remove calendar share token
    await prisma.client.update({
      where: { id },
      data: { calendarShareToken: null }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error revoking calendar share link:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

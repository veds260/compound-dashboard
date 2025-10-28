import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      console.log('[Content Dump GET] Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    console.log('[Content Dump GET] User:', { id: session.user.id, role: session.user.role, clientId: session.user.clientId })
    console.log('[Content Dump GET] Requested clientId:', clientId)

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID required' }, { status: 400 })
    }

    // Fetch content dumps for the client
    const contentDumps = await prisma.contentDump.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    console.log('[Content Dump GET] Found', contentDumps.length, 'content dumps for clientId:', clientId)

    return NextResponse.json(contentDumps)
  } catch (error) {
    console.error('[Content Dump GET] Error fetching content dumps:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content dumps' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      console.log('[Content Dump POST] Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, clientId } = body

    console.log('[Content Dump POST] User:', { id: session.user.id, role: session.user.role, sessionClientId: session.user.clientId })
    console.log('[Content Dump POST] Creating content dump for clientId:', clientId)
    console.log('[Content Dump POST] Content preview:', content.substring(0, 50) + '...')

    if (!content || !clientId) {
      return NextResponse.json(
        { error: 'Content and client ID required' },
        { status: 400 }
      )
    }

    // Create content dump
    const contentDump = await prisma.contentDump.create({
      data: {
        content,
        clientId
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    console.log('[Content Dump POST] Created content dump:', contentDump.id, 'for client:', contentDump.client.name)

    return NextResponse.json(contentDump)
  } catch (error) {
    console.error('[Content Dump POST] Error creating content dump:', error)
    return NextResponse.json(
      { error: 'Failed to create content dump' },
      { status: 500 }
    )
  }
}

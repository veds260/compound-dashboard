import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.contentDump.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Content dump deleted' })
  } catch (error) {
    console.error('Error deleting content dump:', error)
    return NextResponse.json(
      { error: 'Failed to delete content dump' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 })
    }

    const contentDump = await prisma.contentDump.update({
      where: { id: params.id },
      data: { content },
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

    return NextResponse.json(contentDump)
  } catch (error) {
    console.error('Error updating content dump:', error)
    return NextResponse.json(
      { error: 'Failed to update content dump' },
      { status: 500 }
    )
  }
}

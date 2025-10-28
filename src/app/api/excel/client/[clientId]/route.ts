import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateClientReport } from '@/lib/excel-integration'

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = params

    // Check permissions
    let hasAccess = false
    
    if (session.user.role === 'AGENCY') {
      // Verify client belongs to this agency
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          agencyId: session.user.id
        }
      })
      hasAccess = !!client
    } else if (session.user.role === 'CLIENT') {
      hasAccess = session.user.clientId === clientId
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get client name for filename
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { name: true }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const buffer = await generateClientReport(clientId)

    const filename = `${client.name.toLowerCase().replace(/\s+/g, '-')}-report-${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Client Excel export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate client report' },
      { status: 500 }
    )
  }
}
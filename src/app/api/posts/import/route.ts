import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { processPostsUploadFile } from '@/lib/posts-csv-processor'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'AGENCY') {
      return NextResponse.json(
        { error: 'Unauthorized. Agency access required.' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const clientId = formData.get('clientId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Verify client belongs to this agency
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        agencyId: session.user.id
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or unauthorized' },
        { status: 404 }
      )
    }

    // Check if file is CSV
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Please upload a CSV file' },
        { status: 400 }
      )
    }

    // Read file content
    const csvContent = await file.text()

    // Process the CSV file
    const result = await processPostsUploadFile(session.user.id, clientId, csvContent)
    
    return NextResponse.json({
      success: true,
      processedRecords: result.processedRecords,
      savedPosts: result.savedPosts,
      message: `Successfully processed ${result.savedPosts} posts for client approval`
    })

  } catch (error) {
    console.error('Posts import error:', error)
    return NextResponse.json(
      { error: 'Failed to process posts CSV. Please check your CSV format.' },
      { status: 500 }
    )
  }
}
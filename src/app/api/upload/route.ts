import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { processUploadedFile, processFollowersFile } from '@/lib/csv-processor'

export async function POST(request: NextRequest) {
  let uploadId: string | null = null

  try {
    // Authentication check
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'AGENCY') {
      return NextResponse.json(
        { error: 'Unauthorized. Only agency users can upload files.' },
        { status: 403 }
      )
    }

    // Parse form data
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (err) {
      console.error('[Upload] Error parsing form data:', err)
      return NextResponse.json(
        { error: 'Invalid form data' },
        { status: 400 }
      )
    }

    const file = formData.get('file') as File
    const clientId = formData.get('clientId') as string
    const type = (formData.get('type') as string) || 'tweets' // Default to tweets for backward compatibility

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded. Please select a CSV file.' },
        { status: 400 }
      )
    }

    if (!file.name) {
      return NextResponse.json(
        { error: 'Invalid file. File must have a name.' },
        { status: 400 }
      )
    }

    // Validate client ID
    if (!clientId || clientId.trim().length === 0) {
      return NextResponse.json(
        { error: 'Client ID is required. Please select a client.' },
        { status: 400 }
      )
    }

    // Verify client exists and belongs to this agency
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        agencyId: session.user.id
      }
    })

    if (!client) {
      return NextResponse.json(
        {
          error: 'Client not found or you do not have permission to upload for this client.',
          details: 'The selected client may not exist or may not be assigned to you.'
        },
        { status: 404 }
      )
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        {
          error: 'Invalid file type. Please upload a CSV file.',
          details: `Received file: ${file.name}`
        },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: 'File too large. Maximum file size is 10MB.',
          details: `File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
        },
        { status: 400 }
      )
    }

    // Read file content
    let csvContent: string
    try {
      csvContent = await file.text()
    } catch (err) {
      console.error('[Upload] Error reading file:', err)
      return NextResponse.json(
        { error: 'Failed to read file content. The file may be corrupted.' },
        { status: 400 }
      )
    }

    if (!csvContent || csvContent.trim().length === 0) {
      return NextResponse.json(
        { error: 'File is empty. Please upload a file with data.' },
        { status: 400 }
      )
    }

    // Create upload record
    let upload
    try {
      upload = await prisma.upload.create({
        data: {
          filename: `${Date.now()}-${file.name}`,
          originalName: file.name,
          clientId,
          uploadedById: session.user.id,
          processed: false
        }
      })
      uploadId = upload.id
    } catch (err) {
      console.error('[Upload] Error creating upload record:', err)
      return NextResponse.json(
        { error: 'Failed to create upload record in database.' },
        { status: 500 }
      )
    }

    // Process the CSV file based on type
    try {
      const result = type === 'followers'
        ? await processFollowersFile(upload.id, clientId, csvContent)
        : await processUploadedFile(upload.id, clientId, csvContent)

      const csvType = type === 'followers' ? 'followers' : 'tweets'

      return NextResponse.json({
        success: true,
        uploadId: upload.id,
        processedRecords: result.processedRecords,
        newRecords: result.newRecords || 0,
        updatedRecords: result.updatedRecords || 0,
        skippedRecords: result.skippedRecords || 0,
        format: result.format || csvType,
        message: `Successfully processed ${csvType} CSV: ${result.processedRecords} records (${result.newRecords} new, ${result.updatedRecords} updated)`
      })
    } catch (processingError) {
      console.error('[Upload] CSV processing error:', processingError)

      // Delete the upload record if processing fails
      if (uploadId) {
        try {
          await prisma.upload.delete({
            where: { id: uploadId }
          })
        } catch (deleteErr) {
          console.error('[Upload] Error deleting failed upload record:', deleteErr)
        }
      }

      // Return specific error message
      const errorMessage = processingError instanceof Error
        ? processingError.message
        : 'Unknown processing error'

      return NextResponse.json(
        {
          error: 'Failed to process CSV file.',
          details: errorMessage,
          suggestion: 'Please ensure your CSV file is in the correct format (Typefully export or Twitter Analytics format).'
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[Upload] Unexpected error:', error)

    // Clean up upload record if it was created
    if (uploadId) {
      try {
        await prisma.upload.delete({
          where: { id: uploadId }
        })
      } catch (deleteErr) {
        console.error('[Upload] Error deleting upload record after unexpected error:', deleteErr)
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return NextResponse.json(
      {
        error: 'An unexpected error occurred while processing your upload.',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
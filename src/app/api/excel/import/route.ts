import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { processExcelUpload, processAnalyticsUpload } from '@/lib/excel-integration'

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
    const type = formData.get('type') as string // 'posts' or 'analytics'

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Check if file is Excel
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      '.xlsx',
      '.xls'
    ]
    
    const isExcelFile = validTypes.some(type => 
      file.type.includes(type) || file.name.toLowerCase().endsWith(type)
    )

    if (!isExcelFile) {
      return NextResponse.json(
        { error: 'Please upload an Excel file (.xlsx or .xls)' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Process the Excel file based on type
    if (type === 'analytics') {
      const result = await processAnalyticsUpload(session.user.id, buffer)
      return NextResponse.json({
        success: true,
        imported: result.imported,
        errors: result.errors,
        message: `Successfully imported ${result.imported} analytics records${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}`
      })
    } else {
      // Default to posts processing
      const result = await processExcelUpload(session.user.id, buffer)
      return NextResponse.json({
        success: true,
        updated: result.updated,
        errors: result.errors,
        message: `Successfully updated ${result.updated} posts${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}`
      })
    }

  } catch (error) {
    console.error('Excel import error:', error)
    return NextResponse.json(
      { error: 'Failed to process Excel file. Please check the format and try again.' },
      { status: 500 }
    )
  }
}
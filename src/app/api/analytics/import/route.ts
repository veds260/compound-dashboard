import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { processAnalyticsCSV } from '@/lib/analytics-csv-processor'

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

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Check if file is CSV
    if (!file.name.toLowerCase().endsWith('.csv') && !file.type.includes('csv')) {
      return NextResponse.json(
        { error: 'Please upload a CSV file' },
        { status: 400 }
      )
    }

    // Convert file to text
    const text = await file.text()

    // Process the CSV file
    const result = await processAnalyticsCSV(session.user.id, text)

    return NextResponse.json({
      success: true,
      imported: result.imported,
      errors: result.errors,
      message: `Successfully imported ${result.imported} analytics records${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}`
    })

  } catch (error) {
    console.error('Analytics CSV import error:', error)
    return NextResponse.json(
      { error: 'Failed to process CSV file. Please check the format and try again.' },
      { status: 500 }
    )
  }
}
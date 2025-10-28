import Papa from 'papaparse'
import { prisma } from './db'

export interface PostCSVRow {
  date: string
  'topic outline': string
  format: string
  'tweet text': string
  'typefully draft link': string
  'time (gmt +8)': string
  'typefully scheduling': string
  "approval": string
  status: string
  client?: string // Optional client name/identifier
}

export interface ProcessedPost {
  content: string
  tweetText?: string
  typefullyUrl: string
  scheduledDate?: Date
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUGGEST_CHANGES' | 'PUBLISHED'
  clientName?: string
}

export interface ProcessedPostsResult {
  posts: ProcessedPost[]
  timezone?: string
}

export function extractTimezoneFromCSV(csvContent: string): string | undefined {
  // Get the first line (header row)
  const headerLine = csvContent.split('\n')[0]

  // Look for timezone pattern in header like "Time (GMT +8)" or "Time (GMT-5)"
  const timezoneMatch = headerLine.match(/Time\s*\(([^)]+)\)/i)

  if (timezoneMatch && timezoneMatch[1]) {
    return timezoneMatch[1].trim()
  }

  return undefined
}

export function parseTimezoneOffset(timezone: string | undefined): number {
  if (!timezone) return 0

  // Handle GMT+X or GMT-X format
  const gmtMatch = timezone.match(/GMT\s*([+-]?\d+)/)
  if (gmtMatch) {
    return parseInt(gmtMatch[1], 10)
  }

  // Handle common timezone abbreviations
  const timezoneOffsets: { [key: string]: number } = {
    'PST': -8, 'PDT': -7,
    'MST': -7, 'MDT': -6,
    'CST': -6, 'CDT': -5,
    'EST': -5, 'EDT': -4,
    'UTC': 0, 'GMT': 0,
    'BST': 1, 'CET': 1, 'CEST': 2,
    'IST': 5.5, // India
    'HKT': 8, // Hong Kong
    'JST': 9, // Japan
    'AEST': 10, 'AEDT': 11 // Australia
  }

  const upperTimezone = timezone.toUpperCase().trim()
  return timezoneOffsets[upperTimezone] || 0
}

export function parsePostsCSV(csvContent: string): Promise<PostCSVRow[]> {
  return new Promise((resolve, reject) => {
    // Check if first row has proper headers
    const firstLine = csvContent.split('\n')[0]
    const columns = firstLine.split(',').map(col => col.trim())

    // Check if this looks like a header row by looking for key column names
    const hasProperHeaders =
      columns.some(col => col.toLowerCase().includes('topic outline')) &&
      columns.some(col => col.toLowerCase().includes('typefully'))

    if (!hasProperHeaders) {
      // No proper headers found - assume first row is data
      // Check if we can extract timezone from any existing Time column in first row
      const timeColumnIndex = columns.findIndex(col =>
        col.toLowerCase().includes('time') && col.includes('(')
      )

      let timeHeader = 'Time (GMT +8)' // default fallback
      if (timeColumnIndex >= 0) {
        // Use the existing time header if found
        timeHeader = columns[timeColumnIndex]
      }

      const headers = `Date,Topic Outline,Format,Typefully Draft Link,${timeHeader},Typefully Scheduling,Approval,Status`
      csvContent = headers + '\n' + csvContent
    } else {
      // Has headers but first column might be wrong (like "01/08/10" instead of "Date")
      // Replace the first line with corrected headers
      const firstColumnLooksLikeDate = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(columns[0])

      if (firstColumnLooksLikeDate) {
        // Fix the first column to be "Date" while preserving other headers
        columns[0] = 'Date'
        const correctedFirstLine = columns.join(',')
        const restOfContent = csvContent.split('\n').slice(1).join('\n')
        csvContent = correctedFirstLine + '\n' + restOfContent
      }
    }

    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.toLowerCase().trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`))
        } else {
          resolve(results.data as PostCSVRow[])
        }
      },
      error: (error: any) => {
        reject(error)
      }
    })
  })
}

export function processPostsData(rawData: PostCSVRow[], timezone?: string): ProcessedPost[] {
  // Get timezone offset from the timezone string
  const timezoneOffset = parseTimezoneOffset(timezone)
  console.log(`[CSV Processing] Timezone: ${timezone}, Offset: ${timezoneOffset} hours`)

  // Track the last seen date to carry forward to rows without dates
  let lastSeenDate: string | undefined

  return rawData
    .filter(row => row['typefully draft link']?.trim()) // Only process rows with Typefully links
    .map(row => {
      // Update lastSeenDate if this row has a date
      if (row.date && row.date.trim()) {
        lastSeenDate = row.date.trim()
      }

      // Use the current row's date, or carry forward the last seen date
      const effectiveDate = row.date?.trim() || lastSeenDate

      // Find the time column dynamically (it could be "time (gmt +8)", "time (est)", etc.)
      const timeKey = Object.keys(row).find(key => key.startsWith('time ('))
      const timeValue = timeKey ? (row as any)[timeKey] : undefined

      // Parse scheduled date and time
      let scheduledDate: Date | undefined

      if (effectiveDate && timeValue) {
        try {
          // Handle different date formats
          let dateStr = effectiveDate
          const timeStr = timeValue.trim()

          console.log(`[CSV Processing] Parsing: Date="${dateStr}" Time="${timeStr}" (Original date: "${row.date}")`)

          // If date looks like "August 7" without year, intelligently add the year
          if (!/\d{4}/.test(dateStr)) {
            const now = new Date()
            const currentYear = now.getFullYear()

            // Try with current year first
            let testDate = new Date(`${dateStr} ${currentYear}`)

            // If the date is more than 6 months in the future, it's probably from last year
            const monthsInFuture = (testDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
            if (monthsInFuture > 6) {
              dateStr = `${dateStr} ${currentYear - 1}`
            } else {
              dateStr = `${dateStr} ${currentYear}`
            }
          }

          // Parse time (HH:MM format)
          const timeParts = timeStr.split(':')
          const hours = parseInt(timeParts[0], 10)
          const minutes = parseInt(timeParts[1] || '0', 10)

          // Create date object using Date.parse to get year/month/day
          const tempDate = new Date(dateStr)
          const year = tempDate.getFullYear()
          const month = tempDate.getMonth()
          const day = tempDate.getDate()

          console.log(`[CSV Processing] Parsed components: Year=${year} Month=${month} Day=${day} Hours=${hours} Minutes=${minutes}`)

          // CSV times are in the client's timezone, convert to UTC by subtracting the offset
          // This ensures the time displays correctly when shown with timezone info
          const utcHours = hours - timezoneOffset

          scheduledDate = new Date(Date.UTC(year, month, day, utcHours, minutes, 0, 0))

          console.log(`[CSV Processing] UTC Hours: ${utcHours}, Final UTC Date: ${scheduledDate.toISOString()}`)

          // Validate the parsed date
          if (isNaN(scheduledDate.getTime())) {
            console.warn('[CSV Processing] Could not parse date:', effectiveDate, timeValue)
            scheduledDate = undefined
          }
        } catch (error) {
          console.error('[CSV Processing] Error parsing date:', effectiveDate, timeValue, error)
          scheduledDate = undefined
        }
      } else if (effectiveDate || timeValue) {
        console.log(`[CSV Processing] Missing date or time: EffectiveDate="${effectiveDate}" Time="${timeValue}"`)
      }

      // Determine status based on Status column (H) and Approval column (G)
      // Priority: If Status="Posted", it's PUBLISHED (final, overrides Approval)
      let status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUGGEST_CHANGES' | 'PUBLISHED' = 'PENDING'

      const statusLower = row.status?.toLowerCase() || ''
      const approvalLower = row["approval"]?.toLowerCase() || ''

      // Check Status column first - "Posted" is final
      if (statusLower.includes('posted')) {
        status = 'PUBLISHED'
      } else {
        // Check Approval column for other statuses
        if (approvalLower.includes('needs revision')) {
          status = 'SUGGEST_CHANGES'
        } else if (approvalLower.includes('approved')) {
          status = 'APPROVED'
        } else if (approvalLower.includes('rejected')) {
          status = 'REJECTED'
        }
        // else remains PENDING (default)
      }

      // Create content from topic outline, ensure it's not too long
      let content = row['topic outline'] || 'Post content not specified'
      content = content.substring(0, 1000) // Limit content length

      // Extract tweet text if available
      const tweetText = row['tweet text']?.trim() || undefined

      // Ensure typefully URL is valid
      let typefullyUrl = row['typefully draft link'].trim()
      if (!typefullyUrl.startsWith('http')) {
        typefullyUrl = `https://${typefullyUrl}`
      }

      return {
        content,
        tweetText,
        typefullyUrl,
        scheduledDate,
        status,
        clientName: row.client // Optional client identifier
      }
    })
    .filter(post => post.typefullyUrl && post.content) // Ensure we have required fields
}

export async function savePostsToDatabase(
  agencyId: string,
  clientId: string,
  postsData: ProcessedPost[],
  uploadId?: string
) {
  let createdCount = 0
  let updatedCount = 0

  console.log(`Processing ${postsData.length} posts for client ${clientId}`)

  // Process posts one by one with upsert logic to handle duplicates
  for (const post of postsData) {
    try {
      // Check if a post already exists with the same Typefully URL for this client
      const existingPost = await prisma.post.findFirst({
        where: {
          clientId,
          typefullyUrl: post.typefullyUrl
        }
      })

      const postData = {
        content: post.content.substring(0, 1000), // Ensure content isn't too long
        tweetText: post.tweetText || null,
        typefullyUrl: post.typefullyUrl,
        scheduledDate: post.scheduledDate || null,
        status: post.status,
        clientId,
        uploadId: uploadId || null,
        // Preserve existing feedback when updating, only set null for new posts
        feedback: existingPost?.feedback || null
      }

      if (existingPost) {
        // Update existing post with new data from CSV
        await prisma.post.update({
          where: { id: existingPost.id },
          data: postData
        })
        updatedCount++
        console.log(`Updated existing post: ${post.typefullyUrl}`)
      } else {
        // Create new post
        await prisma.post.create({
          data: postData
        })
        createdCount++
      }
    } catch (error) {
      console.error('Error saving post:', error, 'Post data:', post)
      // Continue with other posts even if one fails
    }
  }

  console.log(`Posts processing complete: ${createdCount} new, ${updatedCount} updated`)
  return createdCount + updatedCount
}

export async function processPostsUploadFile(
  agencyId: string,
  clientId: string,
  csvContent: string
) {
  try {
    // Create Upload record to track this import
    const upload = await prisma.upload.create({
      data: {
        filename: `posts-${Date.now()}.csv`,
        originalName: 'posts.csv',
        processed: true,
        clientId,
        uploadedById: agencyId
      }
    })

    // Extract timezone from CSV header
    const timezone = extractTimezoneFromCSV(csvContent)

    const rawData = await parsePostsCSV(csvContent)
    const processedData = processPostsData(rawData, timezone)
    const totalProcessed = await savePostsToDatabase(agencyId, clientId, processedData, upload.id)

    // Update upload record with posts count
    await prisma.upload.update({
      where: { id: upload.id },
      data: { postsCount: totalProcessed }
    })

    // Update client with timezone if found
    if (timezone) {
      await prisma.client.update({
        where: { id: clientId },
        data: { timezone }
      })
      console.log(`Updated client ${clientId} with timezone: ${timezone}`)
    }

    return {
      success: true,
      processedRecords: processedData.length,
      savedPosts: totalProcessed, // This now includes both created and updated posts
      timezone,
      uploadId: upload.id
    }
  } catch (error) {
    console.error('Error processing posts CSV file:', error)
    throw error
  }
}

// Helper function to find or suggest client based on CSV data
export async function findClientForPosts(
  agencyId: string,
  csvData: ProcessedPost[]
): Promise<{ id: string; name: string } | null> {
  // Try to find client by name if provided in CSV
  const clientName = csvData[0]?.clientName
  
  if (clientName) {
    const client = await prisma.client.findFirst({
      where: {
        agencyId,
        name: {
          contains: clientName
        }
      },
      select: { id: true, name: true }
    })
    
    return client
  }

  // If no client name in CSV, return null - user will need to select
  return null
}
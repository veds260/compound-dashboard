import Papa from 'papaparse'
import { prisma } from './db'

// Typefully export format
export interface TypefullyAnalyticsRow {
  tweet_id: string
  created_at: string
  text: string
  url: string
  retweet_count: string
  reply_count: string
  like_count: string
  quote_count: string
  impression_count: string
  user_profile_clicks: string
  bookmark_count: string
  url_link_clicks: string
  total_engagements: string
  engagement_rate: string
  is_thread_head: string
  is_thread_part: string
  is_note_tweet: string
  conversation_length: string
}

// Twitter Analytics (legacy format)
export interface TwitterAnalyticsRow {
  date: string
  impressions: string
  likes: string
  engagements: string
  bookmarks: string
  shares: string
  'new follows': string
  unfollows: string
  replies: string
  reposts: string
  'profile visits': string
  'create post': string
  'video views': string
  'media views': string
}

export interface ProcessedAnalytics {
  date: Date
  impressions: number
  engagements: number
  engagementRate: number
  retweets: number
  replies: number
  likes: number
  profileClicks: number
  urlClicks: number
  hashtagClicks: number
  detailExpands: number
  permalinkClicks: number
  appOpens: number
  appInstalls: number
  follows: number
  emailTweet: number
  dialPhone: number
  mediaViews: number
  mediaEngagements: number
  clickThroughRate: number
}

// Detect CSV format based on headers
function detectCSVFormat(headers: string[]): 'typefully' | 'twitter' {
  const headerSet = new Set(headers.map(h => h.toLowerCase().trim()))

  if (headerSet.has('tweet_id') && headerSet.has('created_at')) {
    return 'typefully'
  }
  return 'twitter'
}

export function parseCSV(csvContent: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      if (!csvContent || csvContent.trim().length === 0) {
        reject(new Error('CSV file is empty'))
        return
      }

      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.toLowerCase().trim(),
        complete: (results) => {
          try {
            if (results.errors.length > 0) {
              const errorMessages = results.errors.map(e => e.message).join(', ')
              console.error('CSV parsing errors:', results.errors)
              reject(new Error(`CSV parsing errors: ${errorMessages}`))
              return
            }

            if (!results.data || results.data.length === 0) {
              reject(new Error('CSV file contains no data rows'))
              return
            }

            resolve(results.data as any[])
          } catch (err) {
            console.error('Error processing CSV parse results:', err)
            reject(new Error('Failed to process CSV parse results'))
          }
        },
        error: (error: any) => {
          console.error('Papa Parse error:', error)
          reject(new Error(`CSV parsing failed: ${error.message || 'Unknown error'}`))
        }
      })
    } catch (err) {
      console.error('Error in parseCSV function:', err)
      reject(new Error('Failed to parse CSV file'))
    }
  })
}

function safeParseInt(value: string | undefined): number {
  if (!value) return 0
  const cleaned = value.toString().replace(/[^0-9.-]/g, '')
  const parsed = parseInt(cleaned) || 0
  return Math.max(0, parsed)
}

function safeParseFloat(value: string | undefined): number {
  if (!value || value === '') return 0
  const cleaned = value.toString().replace(/[^0-9.]/g, '')
  const parsed = parseFloat(cleaned) || 0
  return Math.max(0, parsed)
}

function parseBoolean(value: string | undefined): boolean {
  if (!value || value === '') return false
  const lower = value.toString().toLowerCase().trim()
  return lower === 'true' || lower === '1' || lower === 'yes'
}

function safeParseDate(dateStr: string): Date {
  if (!dateStr) return new Date()

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    // Try parsing different date formats
    const parts = dateStr.split(/[-/]/)
    if (parts.length === 3) {
      // Try MM/DD/YYYY or DD/MM/YYYY format
      const testDate1 = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`)
      const testDate2 = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)

      if (!isNaN(testDate1.getTime())) return testDate1
      if (!isNaN(testDate2.getTime())) return testDate2
    }

    console.warn('Could not parse date:', dateStr, 'using current date')
    return new Date()
  }

  return date
}

// Process Typefully CSV data
export function processTypefullyData(rawData: TypefullyAnalyticsRow[]) {
  return rawData.filter(row => row && row.tweet_id).map(row => {
    const impressions = safeParseInt(row.impression_count)
    const totalEngagements = safeParseInt(row.total_engagements)
    const engagementRate = safeParseFloat(row.engagement_rate)

    return {
      tweetId: row.tweet_id,
      tweetUrl: row.url || '',
      text: row.text || '',
      createdAt: safeParseDate(row.created_at),
      retweetCount: safeParseInt(row.retweet_count),
      replyCount: safeParseInt(row.reply_count),
      likeCount: safeParseInt(row.like_count),
      quoteCount: safeParseInt(row.quote_count),
      impressionCount: impressions,
      userProfileClicks: safeParseInt(row.user_profile_clicks),
      bookmarkCount: safeParseInt(row.bookmark_count),
      urlLinkClicks: safeParseInt(row.url_link_clicks),
      totalEngagements,
      engagementRate,
      isThreadHead: parseBoolean(row.is_thread_head),
      isThreadPart: parseBoolean(row.is_thread_part),
      isNoteTweet: parseBoolean(row.is_note_tweet),
      conversationLength: safeParseInt(row.conversation_length)
    }
  })
}

export function processAnalyticsData(rawData: TwitterAnalyticsRow[]): ProcessedAnalytics[] {
  return rawData.filter(row => row && row.date).map(row => {
    const impressions = safeParseInt(row.impressions)
    const engagements = safeParseInt(row.engagements)
    const likes = safeParseInt(row.likes)
    const profileVisits = safeParseInt(row['profile visits'])
    
    // Calculate engagement rate from data
    const engagementRate = impressions > 0 ? (engagements / impressions) : 0
    const clickThroughRate = impressions > 0 ? (profileVisits / impressions) : 0

    return {
      date: safeParseDate(row.date),
      impressions,
      engagements,
      engagementRate: Math.min(1, engagementRate), // Cap at 100%
      retweets: safeParseInt(row.reposts), // Twitter calls them "reposts" now
      replies: safeParseInt(row.replies),
      likes,
      profileClicks: profileVisits,
      urlClicks: 0, // Not available in this format, set to 0
      hashtagClicks: 0, // Not available in this format, set to 0
      detailExpands: 0, // Not available in this format, set to 0
      permalinkClicks: 0, // Not available in this format, set to 0
      appOpens: 0, // Not available in this format, set to 0
      appInstalls: 0, // Not available in this format, set to 0
      follows: safeParseInt(row['new follows']),
      emailTweet: 0, // Not available in this format, set to 0
      dialPhone: 0, // Not available in this format, set to 0
      mediaViews: safeParseInt(row['media views']),
      mediaEngagements: safeParseInt(row['video views']), // Using video views as media engagement proxy
      clickThroughRate: Math.min(1, clickThroughRate) // Cap at 100%
    }
  })
}

export async function saveAnalyticsToDatabase(
  clientId: string,
  uploadId: string,
  analyticsData: ProcessedAnalytics[]
) {
  // Delete existing analytics for this upload to avoid duplicates
  await prisma.analytics.deleteMany({
    where: { uploadId }
  })

  // Get the date range of the new data
  const dates = analyticsData.map(data => data.date)
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))

  // Delete existing analytics for this client within the same date range
  // This prevents duplicates when uploading overlapping CSV files
  const deletedRecords = await prisma.analytics.deleteMany({
    where: {
      clientId,
      date: {
        gte: minDate,
        lte: maxDate
      },
      uploadId: {
        not: uploadId // Don't delete from current upload (already deleted above)
      }
    }
  })

  console.log(`Cleaned up ${deletedRecords.count} existing analytics records for client ${clientId} from ${minDate.toDateString()} to ${maxDate.toDateString()}`)

  // Save new analytics data one by one to handle validation issues better
  let savedCount = 0
  
  for (const data of analyticsData) {
    try {
      // Validate and clean the data
      const cleanData = {
        date: data.date,
        impressions: Math.max(0, Math.floor(data.impressions || 0)),
        engagements: Math.max(0, Math.floor(data.engagements || 0)),
        retweets: Math.max(0, Math.floor(data.retweets || 0)),
        replies: Math.max(0, Math.floor(data.replies || 0)),
        likes: Math.max(0, Math.floor(data.likes || 0)),
        profileClicks: Math.max(0, Math.floor(data.profileClicks || 0)),
        urlClicks: Math.max(0, Math.floor(data.urlClicks || 0)),
        hashtagClicks: Math.max(0, Math.floor(data.hashtagClicks || 0)),
        detailExpands: Math.max(0, Math.floor(data.detailExpands || 0)),
        permalinkClicks: Math.max(0, Math.floor(data.permalinkClicks || 0)),
        appOpens: Math.max(0, Math.floor(data.appOpens || 0)),
        appInstalls: Math.max(0, Math.floor(data.appInstalls || 0)),
        follows: Math.max(0, Math.floor(data.follows || 0)),
        emailTweet: Math.max(0, Math.floor(data.emailTweet || 0)),
        dialPhone: Math.max(0, Math.floor(data.dialPhone || 0)),
        mediaViews: Math.max(0, Math.floor(data.mediaViews || 0)),
        mediaEngagements: Math.max(0, Math.floor(data.mediaEngagements || 0)),
        engagementRate: Math.max(0, data.engagementRate || 0),
        clickThroughRate: Math.max(0, data.clickThroughRate || 0),
        clientId,
        uploadId
      }

      // Create new record (duplicates already cleaned up above)
      await prisma.analytics.create({
        data: cleanData
      })
      savedCount++
    } catch (error) {
      console.error('Error saving analytics record:', error, 'Data:', data)
      // Continue with other records even if one fails
    }
  }

  console.log(`Processed ${analyticsData.length} analytics records: ${savedCount} new records saved`)

  // Mark upload as processed
  await prisma.upload.update({
    where: { id: uploadId },
    data: { processed: true }
  })
}

// Save Typefully tweet analytics with duplicate detection
export async function saveTypefullyAnalytics(
  clientId: string,
  uploadId: string,
  tweetData: any[]
) {
  let savedCount = 0
  let updatedCount = 0
  let skippedCount = 0

  for (const data of tweetData) {
    try {
      if (!data.tweetId) {
        skippedCount++
        continue
      }

      // Check if tweet already exists for this client (duplicate detection)
      const existing = await prisma.tweetAnalytics.findUnique({
        where: {
          clientId_tweetId: {
            clientId,
            tweetId: data.tweetId
          }
        }
      })

      const cleanData = {
        tweetId: data.tweetId,
        tweetUrl: data.tweetUrl || '',
        text: data.text || '',
        createdAt: data.createdAt,
        retweetCount: Math.max(0, Math.floor(data.retweetCount || 0)),
        replyCount: Math.max(0, Math.floor(data.replyCount || 0)),
        likeCount: Math.max(0, Math.floor(data.likeCount || 0)),
        quoteCount: Math.max(0, Math.floor(data.quoteCount || 0)),
        impressionCount: Math.max(0, Math.floor(data.impressionCount || 0)),
        userProfileClicks: Math.max(0, Math.floor(data.userProfileClicks || 0)),
        bookmarkCount: Math.max(0, Math.floor(data.bookmarkCount || 0)),
        urlLinkClicks: Math.max(0, Math.floor(data.urlLinkClicks || 0)),
        totalEngagements: Math.max(0, Math.floor(data.totalEngagements || 0)),
        engagementRate: Math.max(0, data.engagementRate || 0),
        isThreadHead: data.isThreadHead || false,
        isThreadPart: data.isThreadPart || false,
        isNoteTweet: data.isNoteTweet || false,
        conversationLength: Math.max(0, Math.floor(data.conversationLength || 0)),
        clientId,
        uploadId
      }

      if (existing) {
        // Update existing record with newer data
        await prisma.tweetAnalytics.update({
          where: { id: existing.id },
          data: cleanData
        })
        updatedCount++
      } else {
        // Create new record
        await prisma.tweetAnalytics.create({
          data: cleanData
        })
        savedCount++
      }
    } catch (error) {
      console.error('Error saving tweet analytics:', error, 'Data:', data)
      skippedCount++
    }
  }

  console.log(`Typefully Analytics: ${savedCount} new, ${updatedCount} updated, ${skippedCount} skipped`)

  return { savedCount, updatedCount, skippedCount }
}

export async function processUploadedFile(
  uploadId: string,
  clientId: string,
  csvContent: string
) {
  try {
    // Validate inputs
    if (!uploadId || !clientId || !csvContent) {
      throw new Error('Missing required parameters: uploadId, clientId, or csvContent')
    }

    // Verify upload exists
    const upload = await prisma.upload.findUnique({
      where: { id: uploadId }
    })

    if (!upload) {
      throw new Error(`Upload record not found: ${uploadId}`)
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    })

    if (!client) {
      throw new Error(`Client not found: ${clientId}`)
    }

    const rawData = await parseCSV(csvContent)

    if (!rawData || rawData.length === 0) {
      throw new Error('CSV file is empty or could not be parsed')
    }

    // Detect format based on first row headers
    const headers = Object.keys(rawData[0])
    if (!headers || headers.length === 0) {
      throw new Error('CSV file has no column headers')
    }

    const format = detectCSVFormat(headers)
    console.log(`[CSV Processor] Detected CSV format: ${format} for client ${clientId}`)

    if (format === 'typefully') {
      const processedData = processTypefullyData(rawData as TypefullyAnalyticsRow[])

      if (processedData.length === 0) {
        throw new Error('No valid tweet data found in Typefully CSV')
      }

      const result = await saveTypefullyAnalytics(clientId, uploadId, processedData)

      // Mark upload as processed
      await prisma.upload.update({
        where: { id: uploadId },
        data: { processed: true }
      })

      console.log(`[CSV Processor] Successfully processed Typefully CSV: ${result.savedCount} new, ${result.updatedCount} updated, ${result.skippedCount} skipped`)

      return {
        success: true,
        processedRecords: result.savedCount + result.updatedCount,
        newRecords: result.savedCount,
        updatedRecords: result.updatedCount,
        skippedRecords: result.skippedCount,
        format: 'typefully'
      }
    } else {
      // Legacy Twitter analytics format
      const processedData = processAnalyticsData(rawData as TwitterAnalyticsRow[])

      if (processedData.length === 0) {
        throw new Error('No valid analytics data found in Twitter CSV')
      }

      await saveAnalyticsToDatabase(clientId, uploadId, processedData)

      console.log(`[CSV Processor] Successfully processed Twitter analytics CSV: ${processedData.length} records`)

      return {
        success: true,
        processedRecords: processedData.length,
        newRecords: processedData.length,
        updatedRecords: 0,
        skippedRecords: 0,
        format: 'twitter'
      }
    }
  } catch (error) {
    console.error('[CSV Processor] Error processing CSV file:', error)

    // Provide more specific error messages
    if (error instanceof Error) {
      throw new Error(`CSV processing failed: ${error.message}`)
    } else {
      throw new Error('CSV processing failed due to an unknown error')
    }
  }
}

// Typefully followers CSV format
export interface TypefullyFollowersRow {
  'Date Range': string
  'Followers': string
  'date range'?: string
  'followers'?: string
}

// Process followers CSV data
function parseFollowersData(rows: TypefullyFollowersRow[]) {
  const processedData = []
  let previousFollowerCount = 0

  console.log(`[Followers Parser] Processing ${rows.length} rows`)

  for (const row of rows) {
    try {
      // CSV parser may convert headers to lowercase, so check both cases
      const dateRange = (row['Date Range'] || row['date range'])?.trim()
      const followersStr = (row['Followers'] || row['followers'])?.trim()

      console.log('[Followers Parser] Row:', { dateRange, followersStr })

      // Skip rows with empty follower counts
      if (!dateRange || !followersStr || followersStr === '') {
        console.log('[Followers Parser] Skipping empty row')
        continue
      }

      // Parse date range "2025-08-02 - 2025-08-08"
      const [startDateStr, endDateStr] = dateRange.split(' - ').map(s => s.trim())

      if (!startDateStr) {
        console.log('[Followers Parser] No start date, skipping')
        continue
      }

      // Use endDateStr if it exists, otherwise use startDateStr (for single-day ranges)
      const endDate = endDateStr && endDateStr !== startDateStr ? endDateStr : startDateStr

      const followerCount = parseInt(followersStr, 10)

      // Skip if follower count is invalid (but allow zero)
      if (isNaN(followerCount)) {
        console.log('[Followers Parser] Invalid follower count, skipping')
        continue
      }

      // Calculate followers gained (difference from previous week)
      const followersGained = previousFollowerCount > 0
        ? followerCount - previousFollowerCount
        : 0

      const record = {
        startDate: new Date(startDateStr),
        endDate: new Date(endDate),
        followerCount,
        followersGained
      }

      console.log('[Followers Parser] Parsed record:', record)
      processedData.push(record)

      previousFollowerCount = followerCount
    } catch (error) {
      console.error('Error processing followers row:', error, row)
      continue
    }
  }

  console.log(`[Followers Parser] Processed ${processedData.length} valid records`)
  return processedData
}

// Save followers data with duplicate detection
export async function saveFollowersAnalytics(
  clientId: string,
  uploadId: string,
  followersData: any[]
) {
  let savedCount = 0
  let updatedCount = 0
  let skippedCount = 0

  for (const data of followersData) {
    try {
      // Check if record already exists
      const existing = await prisma.followerAnalytics.findUnique({
        where: {
          clientId_startDate_endDate: {
            clientId,
            startDate: data.startDate,
            endDate: data.endDate
          }
        }
      })

      const cleanData = {
        startDate: data.startDate,
        endDate: data.endDate,
        followerCount: Math.max(0, Math.floor(data.followerCount || 0)),
        followersGained: Math.floor(data.followersGained || 0), // Can be negative
        clientId,
        uploadId
      }

      if (existing) {
        // Update existing record
        await prisma.followerAnalytics.update({
          where: { id: existing.id },
          data: cleanData
        })
        updatedCount++
      } else {
        // Create new record
        await prisma.followerAnalytics.create({
          data: cleanData
        })
        savedCount++
      }
    } catch (error) {
      console.error('Error saving follower analytics:', error, 'Data:', data)
      skippedCount++
    }
  }

  console.log(`Follower Analytics: ${savedCount} new, ${updatedCount} updated, ${skippedCount} skipped`)

  return { savedCount, updatedCount, skippedCount }
}

// Process followers CSV file
export async function processFollowersFile(
  uploadId: string,
  clientId: string,
  csvContent: string
) {
  try {
    if (!uploadId || !clientId || !csvContent) {
      throw new Error('Missing required parameters')
    }

    console.log('[Followers CSV] Starting processing...')
    console.log('[Followers CSV] Content preview:', csvContent.substring(0, 200))

    const rawData = await parseCSV(csvContent)

    console.log('[Followers CSV] Parsed rows:', rawData.length)

    if (!rawData || rawData.length === 0) {
      throw new Error('Followers CSV file is empty or could not be parsed')
    }

    // Check if this is a followers CSV (has "Date Range" and "Followers" columns)
    const headers = Object.keys(rawData[0])
    console.log('[Followers CSV] Headers found:', headers)
    console.log('[Followers CSV] First row data:', rawData[0])

    const hasDateRange = headers.some(h => h.toLowerCase().includes('date range'))
    const hasFollowers = headers.some(h => h.toLowerCase().includes('followers'))

    console.log('[Followers CSV] Has Date Range column:', hasDateRange)
    console.log('[Followers CSV] Has Followers column:', hasFollowers)

    if (!hasDateRange || !hasFollowers) {
      throw new Error('Invalid followers CSV format. Expected "Date Range" and "Followers" columns')
    }

    const processedData = parseFollowersData(rawData as TypefullyFollowersRow[])

    console.log('[Followers CSV] Processed data length:', processedData.length)

    if (processedData.length === 0) {
      throw new Error('No valid follower data found in CSV')
    }

    const result = await saveFollowersAnalytics(clientId, uploadId, processedData)

    // Mark upload as processed
    await prisma.upload.update({
      where: { id: uploadId },
      data: { processed: true }
    })

    console.log(`[CSV Processor] Successfully processed followers CSV: ${result.savedCount} new, ${result.updatedCount} updated`)

    return {
      success: true,
      processedRecords: result.savedCount + result.updatedCount,
      newRecords: result.savedCount,
      updatedRecords: result.updatedCount,
      skippedRecords: result.skippedCount,
      format: 'followers'
    }
  } catch (error) {
    console.error('[CSV Processor] Error processing followers CSV:', error)

    if (error instanceof Error) {
      throw new Error(`Followers CSV processing failed: ${error.message}`)
    } else {
      throw new Error('Followers CSV processing failed due to an unknown error')
    }
  }
}
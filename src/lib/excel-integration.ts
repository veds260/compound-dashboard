import * as XLSX from 'xlsx'
import { prisma } from './db'

export interface ExcelPostData {
  clientName: string
  postContent: string
  tweetText?: string
  typefullyUrl: string
  scheduledDate?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SCHEDULED' | 'PUBLISHED'
  feedback?: string
  createdAt: string
  updatedAt: string
}

export interface ExcelAnalyticsData {
  clientName: string
  date: string
  impressions: number
  engagements: number
  retweets: number
  replies: number
  likes: number
  profileClicks: number
  urlClicks: number
  hashtagClicks: number
  detailExpands: number
  permalinkClicks: number
  follows: number
  mediaViews: number
  mediaEngagements: number
  engagementRate: number
  clickThroughRate: number
}

export async function generateExcelReport(agencyId: string) {
  try {
    // Fetch all posts for the agency's clients
    const posts = await prisma.post.findMany({
      where: {
        client: {
          agencyId: agencyId
        }
      },
      include: {
        client: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform data for Excel
    const excelData: ExcelPostData[] = posts.map(post => ({
      clientName: post.client.name,
      postContent: post.content,
      tweetText: post.tweetText || '',
      typefullyUrl: post.typefullyUrl,
      scheduledDate: post.scheduledDate ? post.scheduledDate.toISOString() : '',
      status: post.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'SCHEDULED' | 'PUBLISHED',
      feedback: post.feedback || '',
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString()
    }))

    // Create workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData, {
      header: [
        'clientName',
        'postContent',
        'tweetText',
        'typefullyUrl',
        'scheduledDate',
        'status',
        'feedback',
        'createdAt',
        'updatedAt'
      ]
    })

    // Set column headers
    const headers = [
      'Client Name',
      'Post Content',
      'Tweet Text',
      'Typefully URL',
      'Scheduled Date',
      'Status',
      'Feedback',
      'Created At',
      'Updated At'
    ]

    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A1' })

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Posts Report')

    // Generate buffer
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
    
    return buffer
  } catch (error) {
    console.error('Error generating Excel report:', error)
    throw error
  }
}

export async function processExcelUpload(
  agencyId: string, 
  excelBuffer: Buffer
): Promise<{ updated: number; errors: string[] }> {
  try {
    const workbook = XLSX.read(excelBuffer)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Convert to JSON
    const data: any[] = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      dateNF: 'yyyy-mm-dd'
    })

    let updated = 0
    const errors: string[] = []

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      try {
        // Find the post by Typefully URL and client name
        const post = await prisma.post.findFirst({
          where: {
            typefullyUrl: row['Typefully URL'] || row.typefullyUrl,
            client: {
              name: row['Client Name'] || row.clientName,
              agencyId: agencyId
            }
          }
        })

        if (!post) {
          errors.push(`Row ${i + 2}: Post not found for client "${row['Client Name'] || row.clientName}" with URL "${row['Typefully URL'] || row.typefullyUrl}"`)
          continue
        }

        // Update post status and feedback if changed
        const newStatus = row['Status'] || row.status
        const newFeedback = row['Feedback'] || row.feedback

        if (newStatus && ['PENDING', 'APPROVED', 'REJECTED', 'SCHEDULED', 'PUBLISHED'].includes(newStatus)) {
          await prisma.post.update({
            where: { id: post.id },
            data: {
              status: newStatus,
              feedback: newFeedback || null
            }
          })
          updated++
        } else {
          errors.push(`Row ${i + 2}: Invalid status "${newStatus}"`)
        }
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return { updated, errors }
  } catch (error) {
    console.error('Error processing Excel upload:', error)
    throw error
  }
}

export async function processAnalyticsUpload(
  agencyId: string,
  excelBuffer: Buffer
): Promise<{ imported: number; errors: string[] }> {
  try {
    const workbook = XLSX.read(excelBuffer)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert to JSON
    const data: any[] = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      dateNF: 'yyyy-mm-dd'
    })

    let imported = 0
    const errors: string[] = []

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      try {
        // Find the client by name
        const client = await prisma.client.findFirst({
          where: {
            name: row['Client Name'] || row.clientName,
            agencyId: agencyId
          }
        })

        if (!client) {
          errors.push(`Row ${i + 2}: Client "${row['Client Name'] || row.clientName}" not found`)
          continue
        }

        // Parse date
        const dateStr = row['Date'] || row.date
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) {
          errors.push(`Row ${i + 2}: Invalid date "${dateStr}"`)
          continue
        }

        // Parse numeric fields
        const impressions = parseInt(row['Impressions'] || row.impressions) || 0
        const engagements = parseInt(row['Engagements'] || row.engagements) || 0
        const retweets = parseInt(row['Retweets'] || row.retweets) || 0
        const replies = parseInt(row['Replies'] || row.replies) || 0
        const likes = parseInt(row['Likes'] || row.likes) || 0
        const profileClicks = parseInt(row['Profile Clicks'] || row.profileClicks) || 0
        const urlClicks = parseInt(row['URL Clicks'] || row.urlClicks) || 0
        const hashtagClicks = parseInt(row['Hashtag Clicks'] || row.hashtagClicks) || 0
        const detailExpands = parseInt(row['Detail Expands'] || row.detailExpands) || 0
        const permalinkClicks = parseInt(row['Permalink Clicks'] || row.permalinkClicks) || 0
        const follows = parseInt(row['Follows'] || row.follows) || 0
        const mediaViews = parseInt(row['Media Views'] || row.mediaViews) || 0
        const mediaEngagements = parseInt(row['Media Engagements'] || row.mediaEngagements) || 0

        // Calculate rates
        const engagementRate = impressions > 0 ? (engagements / impressions) : 0
        const clickThroughRate = impressions > 0 ? (urlClicks / impressions) : 0

        // Upsert analytics record
        await prisma.analytics.upsert({
          where: {
            clientId_date: {
              clientId: client.id,
              date: date
            }
          },
          update: {
            impressions,
            engagements,
            retweets,
            replies,
            likes,
            profileClicks,
            urlClicks,
            hashtagClicks,
            detailExpands,
            permalinkClicks,
            follows,
            mediaViews,
            mediaEngagements,
            engagementRate,
            clickThroughRate
          },
          create: {
            clientId: client.id,
            date,
            impressions,
            engagements,
            retweets,
            replies,
            likes,
            profileClicks,
            urlClicks,
            hashtagClicks,
            detailExpands,
            permalinkClicks,
            follows,
            mediaViews,
            mediaEngagements,
            engagementRate,
            clickThroughRate
          }
        })
        imported++
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return { imported, errors }
  } catch (error) {
    console.error('Error processing analytics upload:', error)
    throw error
  }
}

export async function generateClientReport(clientId: string) {
  try {
    // Fetch posts and analytics for the specific client
    const [posts, analytics] = await Promise.all([
      prisma.post.findMany({
        where: { clientId },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.analytics.findMany({
        where: { clientId },
        orderBy: { date: 'desc' },
        take: 30 // Last 30 days
      })
    ])

    const workbook = XLSX.utils.book_new()

    // Posts sheet
    if (posts.length > 0) {
      const postsData = posts.map(post => ({
        'Post Content': post.content,
        'Tweet Text': post.tweetText || '',
        'Typefully URL': post.typefullyUrl,
        'Status': post.status,
        'Scheduled Date': post.scheduledDate ? post.scheduledDate.toISOString() : '',
        'Feedback': post.feedback || '',
        'Created At': post.createdAt.toISOString(),
        'Updated At': post.updatedAt.toISOString()
      }))

      const postsWorksheet = XLSX.utils.json_to_sheet(postsData)
      XLSX.utils.book_append_sheet(workbook, postsWorksheet, 'Posts')
    }

    // Analytics sheet
    if (analytics.length > 0) {
      const analyticsData = analytics.map(record => ({
        'Date': record.date.toISOString().split('T')[0],
        'Impressions': record.impressions,
        'Engagements': record.engagements,
        'Engagement Rate': (record.engagementRate * 100).toFixed(2) + '%',
        'Retweets': record.retweets,
        'Replies': record.replies,
        'Likes': record.likes,
        'Profile Clicks': record.profileClicks,
        'URL Clicks': record.urlClicks,
        'Hashtag Clicks': record.hashtagClicks,
        'Media Views': record.mediaViews,
        'Follows': record.follows
      }))

      const analyticsWorksheet = XLSX.utils.json_to_sheet(analyticsData)
      XLSX.utils.book_append_sheet(workbook, analyticsWorksheet, 'Analytics')
    }

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
    return buffer
  } catch (error) {
    console.error('Error generating client report:', error)
    throw error
  }
}
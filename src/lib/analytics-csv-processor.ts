import Papa from 'papaparse'
import { prisma } from './db'

interface AnalyticsCSVRow {
  'Client Name'?: string
  clientName?: string
  Date?: string
  date?: string
  Impressions?: string
  impressions?: string
  Engagements?: string
  engagements?: string
  Retweets?: string
  retweets?: string
  Replies?: string
  replies?: string
  Likes?: string
  likes?: string
  'Profile Clicks'?: string
  profileClicks?: string
  'URL Clicks'?: string
  urlClicks?: string
  'Hashtag Clicks'?: string
  hashtagClicks?: string
  'Detail Expands'?: string
  detailExpands?: string
  'Permalink Clicks'?: string
  permalinkClicks?: string
  Follows?: string
  follows?: string
  'Media Views'?: string
  mediaViews?: string
  'Media Engagements'?: string
  mediaEngagements?: string
  [key: string]: string | undefined
}

export async function processAnalyticsCSV(
  agencyId: string,
  csvContent: string
): Promise<{ imported: number; errors: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<AnalyticsCSVRow>(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          let imported = 0
          const errors: string[] = []

          for (let i = 0; i < results.data.length; i++) {
            const row = results.data[i]
            const rowNumber = i + 2 // Account for header row

            try {
              // Get client name
              const clientName = row['Client Name'] || row.clientName
              if (!clientName) {
                errors.push(`Row ${rowNumber}: Missing client name`)
                continue
              }

              // Find the client
              const client = await prisma.client.findFirst({
                where: {
                  name: clientName,
                  agencyId: agencyId
                }
              })

              if (!client) {
                errors.push(`Row ${rowNumber}: Client "${clientName}" not found`)
                continue
              }

              // Parse date
              const dateStr = row['Date'] || row.date
              if (!dateStr) {
                errors.push(`Row ${rowNumber}: Missing date`)
                continue
              }

              const date = new Date(dateStr)
              if (isNaN(date.getTime())) {
                errors.push(`Row ${rowNumber}: Invalid date "${dateStr}"`)
                continue
              }

              // Parse numeric fields with fallback to 0
              const impressions = parseInt(row['Impressions'] || row.impressions || '0') || 0
              const engagements = parseInt(row['Engagements'] || row.engagements || '0') || 0
              const retweets = parseInt(row['Retweets'] || row.retweets || '0') || 0
              const replies = parseInt(row['Replies'] || row.replies || '0') || 0
              const likes = parseInt(row['Likes'] || row.likes || '0') || 0
              const profileClicks = parseInt(row['Profile Clicks'] || row.profileClicks || '0') || 0
              const urlClicks = parseInt(row['URL Clicks'] || row.urlClicks || '0') || 0
              const hashtagClicks = parseInt(row['Hashtag Clicks'] || row.hashtagClicks || '0') || 0
              const detailExpands = parseInt(row['Detail Expands'] || row.detailExpands || '0') || 0
              const permalinkClicks = parseInt(row['Permalink Clicks'] || row.permalinkClicks || '0') || 0
              const follows = parseInt(row['Follows'] || row.follows || '0') || 0
              const mediaViews = parseInt(row['Media Views'] || row.mediaViews || '0') || 0
              const mediaEngagements = parseInt(row['Media Engagements'] || row.mediaEngagements || '0') || 0

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
              errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`)
            }
          }

          resolve({ imported, errors })
        } catch (error) {
          reject(error)
        }
      },
      error: (error: any) => {
        reject(new Error(`CSV parsing error: ${error.message}`))
      }
    })
  })
}
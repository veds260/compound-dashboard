'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  HeartIcon,
  ArrowPathRoundedSquareIcon,
  ChatBubbleOvalLeftIcon,
  ArrowUpTrayIcon,
  ChartBarIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline'

interface MediaItem {
  type: string
  data: string
  name?: string
}

interface TweetMockupProps {
  clientName: string
  twitterHandle?: string
  profilePicture?: string
  tweetText: string
  timestamp?: Date
  media?: MediaItem[]
}

export default function TweetMockup({
  clientName,
  twitterHandle,
  profilePicture,
  tweetText,
  timestamp,
  media
}: TweetMockupProps) {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index))
  }
  const displayHandle = twitterHandle?.startsWith('@')
    ? twitterHandle
    : twitterHandle
    ? `@${twitterHandle}`
    : '@user'

  const displayTime = timestamp
    ? format(new Date(timestamp), 'h:mm a · MMM d, yyyy')
    : format(new Date(), 'h:mm a · MMM d, yyyy')

  // Get initials for default avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Generate realistic engagement numbers
  const generateEngagement = () => {
    const baseViews = Math.floor(Math.random() * 900000) + 100000 // 100K - 1M
    const engagementRate = 0.02 + Math.random() * 0.03 // 2-5% engagement rate
    const totalEngagements = Math.floor(baseViews * engagementRate)

    const likes = Math.floor(totalEngagements * (0.6 + Math.random() * 0.2)) // 60-80% are likes
    const retweets = Math.floor(totalEngagements * (0.08 + Math.random() * 0.07)) // 8-15% are retweets
    const replies = Math.floor(totalEngagements * (0.05 + Math.random() * 0.05)) // 5-10% are replies
    const quotes = Math.floor(retweets * (0.2 + Math.random() * 0.15)) // quotes are a portion of retweets
    const bookmarks = Math.floor(likes * (0.15 + Math.random() * 0.1)) // bookmarks are a portion of likes

    const formatNumber = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
      return num.toString()
    }

    return {
      replies: formatNumber(replies),
      retweets: formatNumber(retweets),
      quotes: formatNumber(quotes),
      likes: formatNumber(likes),
      bookmarks: formatNumber(bookmarks),
      views: formatNumber(baseViews)
    }
  }

  const stats = generateEngagement()

  return (
    <div className="bg-black border border-gray-800 rounded-2xl p-5 w-full mx-auto" style={{ maxWidth: '550px' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            {profilePicture ? (
              <img
                src={profilePicture}
                alt={clientName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {getInitials(clientName)}
              </div>
            )}
          </div>

          {/* Name and Handle */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1">
              <span className="text-white font-bold hover:underline cursor-pointer text-[15px]">
                {clientName}
              </span>
              <svg
                className="w-5 h-5 text-blue-400 flex-shrink-0"
                viewBox="0 0 24 24"
                aria-label="Verified account"
              >
                <g>
                  <path
                    fill="currentColor"
                    d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"
                  />
                </g>
              </svg>
            </div>
            <span className="text-gray-500 text-[15px]">
              {displayHandle}
            </span>
          </div>
        </div>

        {/* More Options */}
        <button className="text-gray-500 hover:text-blue-400 p-2 hover:bg-blue-500/10 rounded-full transition-colors flex-shrink-0">
          <EllipsisHorizontalIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Tweet Content */}
      <div className="mb-4">
        <p className="text-white text-[15px] leading-[1.4] whitespace-pre-wrap break-words">
          {tweetText}
        </p>
      </div>

      {/* Media Gallery */}
      {media && media.length > 0 && (
        <div className={`mb-4 rounded-2xl overflow-hidden border border-gray-800 ${
          media.length === 1 ? '' :
          media.length === 2 ? 'grid grid-cols-2 gap-0.5' :
          media.length === 3 ? 'grid grid-cols-2 gap-0.5' :
          'grid grid-cols-2 gap-0.5'
        }`}>
          {media.map((item, index) => (
            <div
              key={index}
              className={`relative ${
                media.length === 3 && index === 0 ? 'col-span-2' : ''
              }`}
              style={{
                paddingBottom: media.length === 1 ? '56.25%' : '100%'
              }}
            >
              {!imageErrors.has(index) ? (
                <img
                  src={item.data}
                  alt={item.name || `Media ${index + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={() => handleImageError(index)}
                />
              ) : (
                <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center text-center p-4">
                  <svg className="w-12 h-12 text-red-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-red-300 text-sm font-semibold">Image unavailable</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Timestamp */}
      <div className="text-gray-500 text-[15px] mb-4 pb-4 border-b border-gray-800">
        {displayTime} · <span className="text-white font-semibold">X</span> for iPhone
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-around text-gray-500 text-[13px] px-2">
        <button className="flex items-center space-x-1 hover:text-blue-400 p-1.5 hover:bg-blue-500/10 rounded-full transition-colors group">
          <ChatBubbleOvalLeftIcon className="w-[18px] h-[18px]" />
          <span className="text-gray-500 group-hover:text-blue-400 min-w-[30px] text-left">{stats.replies}</span>
        </button>

        <button className="flex items-center space-x-1 hover:text-green-400 p-1.5 hover:bg-green-500/10 rounded-full transition-colors group">
          <ArrowPathRoundedSquareIcon className="w-[18px] h-[18px]" />
          <span className="text-gray-500 group-hover:text-green-400 min-w-[30px] text-left">{stats.retweets}</span>
        </button>

        <button className="flex items-center space-x-1 hover:text-pink-400 p-1.5 hover:bg-pink-500/10 rounded-full transition-colors group">
          <HeartIcon className="w-[18px] h-[18px]" />
          <span className="text-gray-500 group-hover:text-pink-400 min-w-[30px] text-left">{stats.likes}</span>
        </button>

        <button className="flex items-center space-x-1 hover:text-blue-400 p-1.5 hover:bg-blue-500/10 rounded-full transition-colors group">
          <ChartBarIcon className="w-[18px] h-[18px]" />
          <span className="text-gray-500 group-hover:text-blue-400 min-w-[30px] text-left">{stats.views}</span>
        </button>

        <button className="flex items-center space-x-1 hover:text-blue-400 p-1.5 hover:bg-blue-500/10 rounded-full transition-colors group">
          <ArrowUpTrayIcon className="w-[18px] h-[18px]" />
        </button>
      </div>
    </div>
  )
}

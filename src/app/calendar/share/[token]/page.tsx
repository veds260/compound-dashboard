'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon, ChatBubbleLeftIcon, ArrowTopRightOnSquareIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import useSWR from 'swr'
import TweetMockup from '@/components/TweetMockup'
import toast, { Toaster } from 'react-hot-toast'

interface Client {
  id: string
  name: string
  email: string
  twitterHandle: string | null
  profilePicture: string | null
  timezone: string | null
}

interface Comment {
  id: string
  userName: string
  userRole: string
  commentText: string
  selectedText: string
  createdAt: string
}

interface Post {
  id: string
  content: string
  tweetText: string | null
  scheduledDate: string | null
  publishedDate: string | null
  typefullyUrl: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUGGEST_CHANGES' | 'PUBLISHED'
  media: string | null
  createdAt: string
  client: Client
  comments?: Comment[]
}

// SWR fetcher
const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch')
  }
  return response.json()
}

// Helper function to parse timezone offset
function parseTimezoneOffset(timezone: string | undefined | null): number {
  if (!timezone) return 0

  const gmtMatch = timezone.match(/GMT\s*([+-]?\d+)/)
  if (gmtMatch) {
    return parseInt(gmtMatch[1], 10)
  }

  const timezoneOffsets: { [key: string]: number } = {
    'PST': -8, 'PDT': -7,
    'MST': -7, 'MDT': -6,
    'CST': -6, 'CDT': -5,
    'EST': -5, 'EDT': -4,
    'UTC': 0, 'GMT': 0,
    'BST': 1, 'CET': 1, 'CEST': 2,
    'IST': 5.5,
    'HKT': 8,
    'JST': 9,
    'AEST': 10, 'AEDT': 11
  }

  const upperTimezone = timezone.toUpperCase().trim()
  return timezoneOffsets[upperTimezone] || 0
}

// Helper function to convert UTC date to local timezone
function convertToLocalTimezone(utcDateString: string, timezone?: string | null): Date {
  const utcDate = new Date(utcDateString)
  const offset = parseTimezoneOffset(timezone)

  const year = utcDate.getUTCFullYear()
  const month = utcDate.getUTCMonth()
  const day = utcDate.getUTCDate()
  const hours = utcDate.getUTCHours()
  const minutes = utcDate.getUTCMinutes()

  const localHours = hours + offset

  return new Date(year, month, day, localHours, minutes)
}

export default function SharedCalendarPage() {
  const params = useParams()
  const token = params.token as string

  // Use SWR for real-time sync - refreshes every 30 seconds
  const { data, error: swrError, isLoading, mutate } = useSWR<{ client: Client; posts: Post[] }>(
    token ? `/api/calendar/${token}` : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds for real-time sync
      revalidateOnFocus: true,
      keepPreviousData: true,
    }
  )

  const client = data?.client || null
  const posts = data?.posts || []
  const loading = isLoading
  const error = swrError ? 'This calendar link is invalid or has been revoked.' : null

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [postMedia, setPostMedia] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  // Submit a comment
  const handleSubmitComment = async () => {
    if (!selectedPost || !newComment.trim()) return

    setSubmittingComment(true)
    try {
      const response = await fetch(`/api/calendar/${token}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: selectedPost.id,
          commentText: newComment.trim(),
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit comment')
      }

      // Refresh the data to show the new comment
      await mutate()

      // Update the selected post with new comments
      const updatedData = await fetcher(`/api/calendar/${token}`)
      const updatedPost = updatedData.posts.find((p: Post) => p.id === selectedPost.id)
      if (updatedPost) {
        setSelectedPost(updatedPost)
      }

      setNewComment('')
      toast.success('Comment added successfully!')
    } catch (err) {
      console.error('Error submitting comment:', err)
      toast.error('Failed to submit comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  // Get posts grouped by date
  const postsByDate = useMemo(() => {
    const grouped = new Map<string, Post[]>()

    posts
      .filter(post => post.scheduledDate || post.publishedDate)
      .forEach(post => {
        const postTimezone = post.client?.timezone
        const localDate = convertToLocalTimezone(
          post.scheduledDate || post.publishedDate!,
          postTimezone
        )
        const dateKey = format(localDate, 'yyyy-MM-dd')

        if (!grouped.has(dateKey)) {
          grouped.set(dateKey, [])
        }
        grouped.get(dateKey)!.push(post)
      })

    // Sort posts within each date by time
    grouped.forEach((postsArray) => {
      postsArray.sort((a, b) => {
        const timezoneA = a.client?.timezone
        const timezoneB = b.client?.timezone
        const dateA = convertToLocalTimezone(
          a.scheduledDate || a.publishedDate!,
          timezoneA
        )
        const dateB = convertToLocalTimezone(
          b.scheduledDate || b.publishedDate!,
          timezoneB
        )
        return dateA.getTime() - dateB.getTime()
      })
    })

    return grouped
  }, [posts])

  // Get calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentMonth])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-900/40 text-amber-300 border-amber-800'
      case 'APPROVED':
        return 'bg-green-900/40 text-green-300 border-green-800'
      case 'REJECTED':
        return 'bg-red-900/40 text-red-300 border-red-800'
      case 'SUGGEST_CHANGES':
        return 'bg-yellow-900/40 text-yellow-300 border-yellow-800'
      case 'PUBLISHED':
        return 'bg-violet-900/40 text-violet-300 border-violet-800'
      default:
        return 'bg-gray-800/50 text-gray-300 border-gray-700'
    }
  }

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const handleToday = () => setCurrentMonth(new Date())

  const handleOpenPostModal = (post: Post) => {
    setSelectedPost(post)
    if (post.media) {
      try {
        const parsedMedia = JSON.parse(post.media)
        setPostMedia(parsedMedia)
      } catch (error) {
        console.error('Error parsing media:', error)
        setPostMedia([])
      }
    } else {
      setPostMedia([])
    }
  }

  const closeModal = () => {
    setSelectedPost(null)
    setPostMedia([])
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading calendar...</div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            {error || 'Calendar not found'}
          </h1>
          <p className="text-gray-400">
            This share link may have been revoked or is invalid.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-4">
            {client.profilePicture ? (
              <img
                src={client.profilePicture}
                alt={client.name}
                className="w-16 h-16 rounded-full border-4 border-blue-500 shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl border-4 border-blue-500 shadow-lg">
                {client.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">{client.name}'s Content Calendar</h1>
              {client.twitterHandle && (
                <p className="text-blue-400 text-base">@{client.twitterHandle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded bg-amber-900/40 border border-amber-800 mr-1.5"></div>
              <span className="text-gray-300">Pending</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded bg-green-900/40 border border-green-800 mr-1.5"></div>
              <span className="text-gray-300">Approved</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded bg-red-900/40 border border-red-800 mr-1.5"></div>
              <span className="text-gray-300">Rejected</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded bg-yellow-900/40 border border-yellow-800 mr-1.5"></div>
              <span className="text-gray-300">Suggest Changes</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded bg-violet-900/40 border border-violet-800 mr-1.5"></div>
              <span className="text-gray-300">Published</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Today
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-300" />
              </button>
              <span className="text-lg font-semibold text-white min-w-[140px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          {/* Week days header */}
          <div className="grid grid-cols-7 border-b border-gray-700 bg-gray-900/50">
            {weekDays.map(day => (
              <div
                key={day}
                className="py-3 text-center text-sm font-semibold text-gray-300"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 auto-rows-fr" style={{ minHeight: '500px' }}>
            {calendarDays.map((day, idx) => {
              const dateKey = format(day, 'yyyy-MM-dd')
              const dayPosts = postsByDate.get(dateKey) || []
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isTodayDate = isToday(day)

              return (
                <div
                  key={idx}
                  className={`border-r border-b border-gray-700 p-2 min-h-[120px] ${
                    !isCurrentMonth ? 'bg-gray-900/50' : 'bg-gray-800'
                  } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
                >
                  {/* Date number */}
                  <div className="flex justify-end mb-1">
                    <span
                      className={`text-sm font-medium ${
                        isTodayDate
                          ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center'
                          : isCurrentMonth
                          ? 'text-white'
                          : 'text-gray-500'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Posts container */}
                  {dayPosts.length > 0 && (
                    <div className="space-y-1.5 max-h-[90px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {dayPosts.map(post => {
                        const postTimezone = post.client?.timezone
                        const postDate = convertToLocalTimezone(
                          post.scheduledDate || post.publishedDate!,
                          postTimezone
                        )
                        return (
                          <button
                            key={post.id}
                            onClick={() => handleOpenPostModal(post)}
                            className={`w-full text-left p-2 rounded-lg border transition-all hover:shadow-md cursor-pointer ${getStatusColor(post.status)}`}
                          >
                            <div className="text-xs font-semibold mb-0.5">
                              {format(postDate, 'h:mm a')}
                            </div>
                            <div className="text-xs line-clamp-2 opacity-90">
                              {post.content.length > 40
                                ? `${post.content.substring(0, 40)}...`
                                : post.content}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm pt-6 border-t border-gray-800 mt-6">
          <p>Shared securely via Compound Dashboard</p>
        </div>
      </div>

      {/* Post Details Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-gray-800 rounded-xl w-full max-w-2xl shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-medium text-white">Post Preview</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {selectedPost.tweetText && selectedPost.tweetText.trim() !== '' ? (
                <div className="flex justify-center">
                  <TweetMockup
                    clientName={selectedPost.client.name}
                    twitterHandle={selectedPost.client.twitterHandle || undefined}
                    profilePicture={selectedPost.client.profilePicture || undefined}
                    tweetText={selectedPost.tweetText}
                    timestamp={selectedPost.scheduledDate ? new Date(selectedPost.scheduledDate) : undefined}
                    media={postMedia}
                  />
                </div>
              ) : (
                <div className="p-6 bg-gray-900 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400 mb-2">Content:</p>
                  <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{selectedPost.content}</p>
                </div>
              )}

              {/* Post Details */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">Status:</span>
                  <span className={`text-sm font-medium px-3 py-1 rounded-lg border ${getStatusColor(selectedPost.status)}`}>
                    {selectedPost.status === 'SUGGEST_CHANGES' ? 'SUGGEST CHANGES' : selectedPost.status}
                  </span>
                </div>

                {selectedPost.scheduledDate && (
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">Scheduled:</span>
                    <span className="text-sm text-gray-200">
                      {format(convertToLocalTimezone(selectedPost.scheduledDate, selectedPost.client.timezone), 'PPpp')}
                      {selectedPost.client.timezone && (
                        <span className="ml-2 text-gray-500">({selectedPost.client.timezone})</span>
                      )}
                    </span>
                  </div>
                )}

                {selectedPost.publishedDate && (
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">Published:</span>
                    <span className="text-sm text-gray-200">
                      {format(new Date(selectedPost.publishedDate), 'PPpp')}
                    </span>
                  </div>
                )}

                {/* Open in Typefully Button */}
                {selectedPost.typefullyUrl && (
                  <div className="pt-4">
                    <a
                      href={selectedPost.typefullyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      Open in Typefully
                    </a>
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="mt-8 border-t border-gray-700 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <ChatBubbleLeftIcon className="h-5 w-5 text-gray-400" />
                  <h4 className="text-base font-medium text-white">
                    Comments ({selectedPost.comments?.length || 0})
                  </h4>
                </div>

                {/* Existing Comments */}
                {selectedPost.comments && selectedPost.comments.length > 0 ? (
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                    {selectedPost.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-gray-900/50 rounded-lg p-3 border border-gray-700"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-400">
                            {comment.userName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">{comment.commentText}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-4">No comments yet. Be the first to leave feedback!</p>
                )}

                {/* Add Comment Form */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmitComment()
                      }
                    }}
                  />
                  <button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || submittingComment}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    {submittingComment ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <PaperAirplaneIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <Toaster position="bottom-right" />
    </div>
  )
}

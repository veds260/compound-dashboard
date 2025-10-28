'use client'

import { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, startOfWeek, endOfWeek } from 'date-fns'
import toast from 'react-hot-toast'
import { PencilIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import TweetMockup from './TweetMockup'

interface Post {
  id: string
  content: string
  tweetText?: string
  scheduledDate?: string
  typefullyUrl: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUGGEST_CHANGES' | 'PUBLISHED'
  feedback?: string
  createdAt: string
  publishedDate?: string
  client?: {
    id: string
    name: string
    email: string
    timezone?: string
    twitterHandle?: string
    profilePicture?: string
  }
}

interface PostCalendarProps {
  posts: Post[]
  userRole: 'AGENCY' | 'CLIENT'
  clientTimezone?: string
  onEditPost?: (post: Post) => void
  onViewPost?: (post: Post) => void
  onPostUpdate?: () => void
}

// Helper function to parse timezone offset
function parseTimezoneOffset(timezone: string | undefined): number {
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

// Helper function to convert UTC date to local timezone
function convertToLocalTimezone(utcDateString: string, timezone?: string): Date {
  const utcDate = new Date(utcDateString)
  const offset = parseTimezoneOffset(timezone)

  // Get UTC components
  const year = utcDate.getUTCFullYear()
  const month = utcDate.getUTCMonth()
  const day = utcDate.getUTCDate()
  const hours = utcDate.getUTCHours()
  const minutes = utcDate.getUTCMinutes()

  // Add offset to get local time
  const localHours = hours + offset

  // Create new date with local time components
  return new Date(year, month, day, localHours, minutes)
}

export default function PostCalendar({ posts, userRole, clientTimezone, onEditPost, onViewPost, onPostUpdate }: PostCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [feedbackAction, setFeedbackAction] = useState<'SUGGEST_CHANGES' | 'REJECTED'>('SUGGEST_CHANGES')
  const [feedback, setFeedback] = useState('')

  // Get posts grouped by date (using each post's client timezone)
  const postsByDate = useMemo(() => {
    const grouped = new Map<string, Post[]>()

    posts
      .filter(post => post.scheduledDate || post.publishedDate)
      .forEach(post => {
        // Use post's client timezone, fallback to prop timezone
        const postTimezone = post.client?.timezone || clientTimezone
        // Convert UTC date to client's timezone for grouping
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

    // Sort posts within each date by time (using local timezone)
    grouped.forEach((postsArray, key) => {
      postsArray.sort((a, b) => {
        const timezoneA = a.client?.timezone || clientTimezone
        const timezoneB = b.client?.timezone || clientTimezone
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
  }, [posts, clientTimezone])

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
        return 'bg-approve-bg/60 text-approve-text border-approve-border'
      case 'REJECTED':
        return 'bg-reject-bg/60 text-reject-text border-reject-border'
      case 'SUGGEST_CHANGES':
        return 'bg-suggest-bg/60 text-suggest-text border-suggest-border'
      case 'PUBLISHED':
        return 'bg-violet-900/40 text-violet-300 border-violet-800'
      default:
        return 'bg-theme-bg/50 text-gray-300 border-theme-border'
    }
  }

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const handleToday = () => setCurrentMonth(new Date())

  const closeModal = () => setSelectedPost(null)

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="space-y-4">
      {/* Legend and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded bg-amber-900/40 border border-amber-800 mr-1.5"></div>
            <span className="text-gray-300">Pending</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded bg-approve-bg border border-approve-border mr-1.5"></div>
            <span className="text-gray-300">Approved</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded bg-reject-bg border border-reject-border mr-1.5"></div>
            <span className="text-gray-300">Rejected</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded bg-suggest-bg border border-suggest-border mr-1.5"></div>
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
            className="px-3 py-1.5 bg-theme-accent text-white text-sm rounded-lg hover:bg-theme-accent/80 transition-colors opacity-90 hover:opacity-100"
          >
            Today
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-theme-card transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-300" />
            </button>
            <span className="text-lg font-semibold text-white min-w-[140px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-theme-card transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-theme-card rounded-xl border border-theme-border overflow-hidden">
        {/* Week days header */}
        <div className="grid grid-cols-7 border-b border-theme-border bg-theme-bg/50">
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
                className={`border-r border-b border-theme-border p-2 min-h-[120px] ${
                  !isCurrentMonth ? 'bg-theme-bg/50' : 'bg-theme-card'
                } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
              >
                {/* Date number */}
                <div className="flex justify-end mb-1">
                  <span
                    className={`text-sm font-medium ${
                      isTodayDate
                        ? 'bg-theme-accent text-white rounded-full w-7 h-7 flex items-center justify-center'
                        : isCurrentMonth
                        ? 'text-white'
                        : 'text-gray-400'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                </div>

                {/* Posts container with scroll */}
                {dayPosts.length > 0 && (
                  <div className="space-y-1.5 max-h-[90px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {dayPosts.map(post => {
                      // Use post's client timezone, fallback to prop timezone
                      const postTimezone = post.client?.timezone || clientTimezone
                      // Convert UTC date to client's local timezone
                      const postDate = convertToLocalTimezone(
                        post.scheduledDate || post.publishedDate!,
                        postTimezone
                      )
                      return (
                        <button
                          key={post.id}
                          onClick={() => setSelectedPost(post)}
                          className={`w-full text-left p-2 rounded-lg border transition-all hover:shadow-md ${getStatusColor(
                            post.status
                          )}`}
                        >
                          {/* Time */}
                          <div className="text-xs font-semibold mb-0.5">
                            {format(postDate, 'h:mm a')}
                          </div>
                          {/* Content preview */}
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

      {/* Post Details Modal with Tweet Preview */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPost(null)}>
          <div className="bg-theme-card/95 backdrop-blur-sm rounded-xl w-full max-w-3xl shadow-large border border-theme-border max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-theme-card border-b border-theme-border px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-medium text-white">Post Preview</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {(() => {
                const hasTweetText = selectedPost.tweetText && selectedPost.tweetText.trim().length > 0

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left side - Tweet Preview */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-3">
                        {hasTweetText ? 'Tweet Preview' : 'Content Overview'}
                      </h4>
                      {hasTweetText ? (
                        <TweetMockup
                          clientName={selectedPost.client?.name || 'Client'}
                          twitterHandle={selectedPost.client?.twitterHandle}
                          profilePicture={selectedPost.client?.profilePicture}
                          tweetText={selectedPost.tweetText}
                          timestamp={selectedPost.scheduledDate ? new Date(selectedPost.scheduledDate) : undefined}
                        />
                      ) : (
                        <div className="space-y-4">
                          <div className="p-6 bg-theme-bg rounded-lg border border-theme-border">
                            <p className="text-sm text-gray-400 mb-2">Topic Outline:</p>
                            <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{selectedPost.content}</p>
                          </div>
                          <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
                            <p className="text-sm text-blue-300">
                              <span className="font-semibold">Note:</span> Tweet preview not available. Click "Open in Typefully" to view and edit the full content.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right side - Post Details */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Post Details</h4>
                      <div className="space-y-4">
                        {/* Status Badge */}
                        <div>
                          <dt className="text-xs font-medium text-gray-500 mb-1">Status</dt>
                          <dd>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              selectedPost.status === 'PENDING' ? 'bg-amber-900/50 text-amber-200 border border-amber-800' :
                              selectedPost.status === 'APPROVED' ? 'bg-approve-bg text-approve-text border border-approve-border' :
                              selectedPost.status === 'REJECTED' ? 'bg-reject-bg text-reject-text border border-reject-border' :
                              selectedPost.status === 'SUGGEST_CHANGES' ? 'bg-suggest-bg text-suggest-text border border-suggest-border' :
                              'bg-violet-900/50 text-violet-200 border border-violet-800'
                            }`}>
                              {selectedPost.status === 'SUGGEST_CHANGES' ? 'SUGGEST CHANGES' : selectedPost.status}
                            </span>
                          </dd>
                        </div>

                        {/* Client Name (for agency view) */}
                        {userRole === 'AGENCY' && selectedPost.client && (
                          <div>
                            <dt className="text-xs font-medium text-gray-500 mb-1">Client</dt>
                            <dd className="text-sm text-gray-300">{selectedPost.client.name}</dd>
                          </div>
                        )}

                        {/* Scheduled Date */}
                        {selectedPost.scheduledDate && (
                          <div>
                            <dt className="text-xs font-medium text-gray-500 mb-1">Scheduled For</dt>
                            <dd className="text-sm text-gray-300">
                              {(() => {
                                const postTimezone = selectedPost.client?.timezone || clientTimezone
                                return format(convertToLocalTimezone(selectedPost.scheduledDate, postTimezone), 'PPpp')
                              })()}
                              {(selectedPost.client?.timezone || clientTimezone) && (
                                <span className="ml-2 text-gray-500">
                                  ({selectedPost.client?.timezone || clientTimezone})
                                </span>
                              )}
                            </dd>
                          </div>
                        )}

                        {/* Published Date */}
                        {selectedPost.publishedDate && (
                          <div>
                            <dt className="text-xs font-medium text-gray-500 mb-1">Published Date</dt>
                            <dd className="text-sm text-gray-300">
                              {format(new Date(selectedPost.publishedDate), 'PPpp')}
                            </dd>
                          </div>
                        )}

                        {/* Feedback */}
                        {selectedPost.feedback && (
                          <div>
                            <dt className="text-xs font-medium text-gray-500 mb-1">Feedback</dt>
                            <dd className="text-sm text-gray-300 whitespace-pre-wrap bg-theme-bg p-3 rounded-lg">
                              {selectedPost.feedback}
                            </dd>
                          </div>
                        )}

                        {/* Typefully Link */}
                        <div>
                          <a
                            href={selectedPost.typefullyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium w-full justify-center"
                          >
                            <span>Open in Typefully</span>
                            <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-2" />
                          </a>
                        </div>

                        {/* Client approval buttons */}
                        {userRole === 'CLIENT' && selectedPost.status === 'PENDING' && (
                          <div className="space-y-2 pt-4 border-t border-theme-border">
                            <button
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/posts/${selectedPost.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'APPROVED' })
                                  })
                                  if (response.ok) {
                                    toast.success('Post approved!')
                                    closeModal()
                                    if (onPostUpdate) onPostUpdate()
                                  } else {
                                    const error = await response.json()
                                    toast.error(error.error || 'Failed to approve post')
                                  }
                                } catch (error) {
                                  console.error('Approve error:', error)
                                  toast.error('Failed to approve post')
                                }
                              }}
                              className="w-full bg-approve-bg text-approve-text border border-approve-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-approve-hover transition-colors duration-200"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setFeedbackAction('SUGGEST_CHANGES')
                                setFeedback('')
                                setFeedbackModalOpen(true)
                              }}
                              className="w-full bg-suggest-bg text-suggest-text border border-suggest-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-suggest-hover transition-colors duration-200"
                            >
                              Suggest Changes
                            </button>
                            <button
                              onClick={() => {
                                setFeedbackAction('REJECTED')
                                setFeedback('')
                                setFeedbackModalOpen(true)
                              }}
                              className="w-full bg-reject-bg text-reject-text border border-reject-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-reject-hover transition-colors duration-200"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModalOpen && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={() => {
          setFeedbackModalOpen(false)
          setFeedback('')
        }}>
          <div className="bg-theme-card/95 backdrop-blur-sm rounded-xl p-6 w-full max-w-lg shadow-large border border-theme-border" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-white mb-4">
              {feedbackAction === 'SUGGEST_CHANGES' ? 'Suggest Changes' : 'Reject Post'}
            </h3>

            <form onSubmit={async (e) => {
              e.preventDefault()
              try {
                const response = await fetch(`/api/posts/${selectedPost.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    status: feedbackAction,
                    feedback: feedback || undefined
                  })
                })
                if (response.ok) {
                  toast.success(feedbackAction === 'SUGGEST_CHANGES' ? 'Feedback sent!' : 'Post rejected')
                  setFeedbackModalOpen(false)
                  setFeedback('')
                  closeModal()
                  if (onPostUpdate) onPostUpdate()
                } else {
                  const error = await response.json()
                  toast.error(error.error || 'Failed to update post')
                }
              } catch (error) {
                console.error('Update error:', error)
                toast.error('Failed to update post')
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {feedbackAction === 'SUGGEST_CHANGES'
                    ? 'Provide feedback for improvement *'
                    : 'Provide rejection reason (optional)'}
                </label>
                <textarea
                  required={feedbackAction === 'SUGGEST_CHANGES'}
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full rounded-md border-theme-border bg-theme-bg text-gray-200 placeholder-gray-500 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-3"
                  placeholder={feedbackAction === 'SUGGEST_CHANGES'
                    ? 'Enter your suggestions for improvement...'
                    : 'Enter rejection reason...'}
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setFeedbackModalOpen(false)
                    setFeedback('')
                  }}
                  className="px-4 py-2 border border-theme-border rounded-md text-gray-300 bg-theme-card hover:bg-theme-bg opacity-90 hover:opacity-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-md border opacity-90 hover:opacity-100 ${
                    feedbackAction === 'SUGGEST_CHANGES'
                      ? 'bg-suggest-bg text-suggest-text border-suggest-border hover:bg-suggest-hover'
                      : 'bg-reject-bg text-reject-text border-reject-border hover:bg-reject-hover'
                  }`}
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

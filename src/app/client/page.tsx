'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import Layout from '@/components/Layout'
import ErrorBoundary from '@/components/ErrorBoundary'
import PremiumCard from '@/components/PremiumCard'
import { DocumentTextIcon, ChartBarIcon, ClockIcon, ArrowsPointingOutIcon, CheckCircleIcon, XCircleIcon, ArrowTopRightOnSquareIcon, CalendarIcon, CheckIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json())

interface ClientStats {
  scheduledPosts: number
  pendingApprovals: number
  analyticsData: number
}

interface Post {
  id: string
  content: string
  scheduledDate?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUGGEST_CHANGES' | 'PUBLISHED'
  typefullyUrl?: string
  feedback?: string
  media?: string
  createdAt: string
  client?: {
    id: string
    name: string
    email: string
    timezone?: string
  }
}

// Custom Hourglass Icon Component - simple and clean
function HourglassIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 2h8M8 22h8" strokeLinecap="round"/>
      <path d="M10 18c0 .5.5 1 1 1h2c.5 0 1-.5 1-1v-1.5c0-.3-.2-.5-.5-.5h-3c-.3 0-.5.2-.5.5V18z" fill="currentColor" opacity="0.25"/>
      <path d="M15 2c1.1 0 2 .9 2 2v4c0 1.8-1.2 3.4-2.9 3.9l-.1.1.1.1c1.7.5 2.9 2.1 2.9 3.9v4c0 1.1-.9 2-2 2H9c-1.1 0-2-.9-2-2v-4c0-1.8 1.2-3.4 2.9-3.9l.1-.1-.1-.1C8.2 11.4 7 9.8 7 8V4c0-1.1.9-2 2-2h6z"/>
    </svg>
  )
}

// Custom Calendar Icon Component - clean with grid
function DetailedCalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round"/>
      <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <line x1="8" y1="14" x2="8" y2="14" strokeWidth="3" strokeLinecap="round"/>
      <line x1="12" y1="14" x2="12" y2="14" strokeWidth="3" strokeLinecap="round"/>
      <line x1="16" y1="14" x2="16" y2="14" strokeWidth="3" strokeLinecap="round"/>
      <line x1="8" y1="18" x2="8" y2="18" strokeWidth="3" strokeLinecap="round"/>
      <line x1="12" y1="18" x2="12" y2="18" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}

// Helper function to parse timezone offset
function parseTimezoneOffset(timezone: string | undefined): number {
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
function convertToLocalTimezone(utcDateString: string, timezone?: string): Date {
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

export default function ClientDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<string>('PENDING')
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const [feedbackAction, setFeedbackAction] = useState<'SUGGEST_CHANGES' | 'REJECTED'>('SUGGEST_CHANGES')
  const [feedback, setFeedback] = useState('')

  // Use SWR for caching with 30 second refresh
  const { data: stats, mutate: mutateStats, isLoading: statsLoading } = useSWR<ClientStats>(
    session?.user?.role === 'CLIENT' ? '/api/client/stats' : null,
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: true }
  )

  const { data: posts, mutate: mutatePosts, isLoading: postsLoading } = useSWR<Post[]>(
    session?.user?.clientId ? `/api/posts?clientId=${session.user.clientId}` : null,
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: true }
  )

  const loading = statsLoading || postsLoading

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role === 'AGENCY') {
      router.push('/dashboard')
      return
    }

    if (session.user.role === 'ADMIN') {
      router.push('/admin')
      return
    }

    if (session.user.role !== 'CLIENT') {
      router.push('/login')
      return
    }
  }, [session, status, router])

  const handleStatusUpdate = async (postId: string, newStatus: string, feedback?: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, feedback })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update post status')
      }

      const updatedPost = await response.json()

      // Update local state
      if (selectedPost?.id === postId) {
        setSelectedPost(updatedPost)
      }

      // Revalidate both stats and posts cache
      mutateStats()
      mutatePosts()

      toast.success(`Post ${newStatus.toLowerCase()}`)
    } catch (error) {
      console.error('Error updating post:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update post')
    }
  }

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPost) return

    await handleStatusUpdate(selectedPost.id, feedbackAction, feedback)
    setIsFeedbackModalOpen(false)
    setFeedback('')
  }

  const openFeedbackModal = (action: 'SUGGEST_CHANGES' | 'REJECTED') => {
    setFeedbackAction(action)
    setFeedback('')
    setIsFeedbackModalOpen(true)
  }

  const openPostModal = (post: Post) => {
    setSelectedPost(post)
    setIsPostModalOpen(true)
  }

  if (status === 'loading' || !session || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent"></div>
        </div>
      </Layout>
    )
  }

  // Use stats from API instead of recalculating
  const pendingCount = stats?.pendingApprovals || 0
  const suggestChangesCount = posts?.filter(p => p.status === 'SUGGEST_CHANGES').length || 0

  const statCards = [
    {
      name: 'Scheduled Posts',
      value: stats?.scheduledPosts || 0,
      description: 'Set for release',
      icon: DetailedCalendarIcon,
      iconColor: 'text-white',
      color: 'bg-blue-500',
      href: '/client/calendar'
    },
    {
      name: 'Pending Approvals',
      value: stats?.pendingApprovals || 0,
      description: 'Need your review',
      icon: HourglassIcon,
      iconColor: 'text-amber-200',
      color: 'bg-amber-900',
      href: '/client/posts'
    },
    {
      name: 'Approved Posts',
      value: stats?.analyticsData || 0,
      description: 'Ready to publish',
      icon: CheckIcon,
      iconColor: 'text-white',
      color: 'bg-green-700',
      href: '/client/posts'
    },
  ]

  const filteredPosts = statusFilter === 'ALL'
    ? (posts || []).slice(0, 6)
    : (posts || []).filter(post => post.status === statusFilter).slice(0, 6)

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-suggest-bg text-suggest-text border border-suggest-border',
      APPROVED: 'bg-approve-bg text-approve-text border border-approve-border',
      REJECTED: 'bg-reject-bg text-reject-text border border-reject-border',
      SUGGEST_CHANGES: 'bg-suggest-bg text-suggest-text border border-suggest-border',
      PUBLISHED: 'bg-approve-bg text-approve-text border border-approve-border'
    }

    const icons = {
      PENDING: ClockIcon,
      APPROVED: CheckCircleIcon,
      REJECTED: XCircleIcon,
      SUGGEST_CHANGES: ClockIcon,
      PUBLISHED: CheckCircleIcon
    }

    const labels = {
      PENDING: 'PENDING',
      APPROVED: 'APPROVED',
      REJECTED: 'REJECTED',
      SUGGEST_CHANGES: 'SUGGEST CHANGES',
      PUBLISHED: 'PUBLISHED'
    }

    const Icon = icons[status as keyof typeof icons]

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        <Icon className="w-4 h-4 mr-1" />
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  return (
    <ErrorBoundary>
      <Layout>
        <div className="space-y-6 bg-theme-bg">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-white sm:text-3xl">
              Client Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Your content approvals and performance, in one view.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((card) => (
            <PremiumCard
              key={card.name}
              hover
              gradient
              className="p-8 cursor-pointer animate-slide-up bg-theme-card border-theme-border"
              onClick={() => {
                if (card.name === 'Pending Approvals') {
                  router.push('/client/posts?filter=PENDING')
                } else if (card.name === 'Approved Posts') {
                  router.push('/client/posts?filter=APPROVED')
                } else if (card.name === 'Scheduled Posts') {
                  router.push('/client/calendar')
                }
              }}
            >
              <div className="space-y-4">
                <div className={`${card.color} rounded-xl p-4 w-fit shadow-lg`}>
                  <card.icon className={`w-7 h-7 ${card.iconColor}`} strokeWidth={card.name === 'Approved Posts' ? 3 : 2} />
                </div>
                <div>
                  <p className="text-xl font-semibold text-white">{card.name}</p>
                  <p className="text-sm text-gray-400 mt-1">{card.description}</p>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-5xl font-bold text-white">{card.value}</p>
              </div>
            </PremiumCard>
          ))}
        </div>

        {/* Content Review Section */}
        <div id="content-review">
          <PremiumCard className="animate-fade-in bg-theme-card border-theme-border" gradient>
            <div className="px-6 py-5 border-b border-theme-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-semibold text-white">Content Review</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Check and approve upcoming content.
                </p>
              </div>
              <button
                onClick={() => router.push(`/client/posts${statusFilter !== 'ALL' ? `?filter=${statusFilter}` : ''}`)}
                className="text-gray-400 hover:text-gray-300 transition-colors"
                title="View all posts"
              >
                <ArrowsPointingOutIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-6 pt-4 pb-2">
            <div className="flex items-center space-x-2 overflow-x-auto">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap opacity-90 hover:opacity-100 ${
                  statusFilter === 'ALL'
                    ? 'bg-theme-accent text-white shadow-md'
                    : 'bg-theme-card border border-theme-border text-gray-400 hover:text-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap opacity-90 hover:opacity-100 ${
                  statusFilter === 'PENDING'
                    ? 'bg-theme-accent text-white shadow-md'
                    : 'bg-theme-card border border-theme-border text-gray-400 hover:text-gray-300'
                }`}
              >
                Pending {pendingCount > 0 && `(${pendingCount})`}
              </button>
              <button
                onClick={() => setStatusFilter('SUGGEST_CHANGES')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap opacity-90 hover:opacity-100 ${
                  statusFilter === 'SUGGEST_CHANGES'
                    ? 'bg-theme-accent text-white shadow-md'
                    : 'bg-theme-card border border-theme-border text-gray-400 hover:text-gray-300'
                }`}
              >
                Suggest Changes {suggestChangesCount > 0 && `(${suggestChangesCount})`}
              </button>
              <button
                onClick={() => setStatusFilter('APPROVED')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap opacity-90 hover:opacity-100 ${
                  statusFilter === 'APPROVED'
                    ? 'bg-theme-accent text-white shadow-md'
                    : 'bg-theme-card border border-theme-border text-gray-400 hover:text-gray-300'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setStatusFilter('REJECTED')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap opacity-90 hover:opacity-100 ${
                  statusFilter === 'REJECTED'
                    ? 'bg-theme-accent text-white shadow-md'
                    : 'bg-theme-card border border-theme-border text-gray-400 hover:text-gray-300'
                }`}
              >
                Rejected
              </button>
              <button
                onClick={() => setStatusFilter('PUBLISHED')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap opacity-90 hover:opacity-100 ${
                  statusFilter === 'PUBLISHED'
                    ? 'bg-theme-accent text-white shadow-md'
                    : 'bg-theme-card border border-theme-border text-gray-400 hover:text-gray-300'
                }`}
              >
                Published
              </button>
            </div>
          </div>

          {/* Post Cards Grid */}
          <div className="px-6 py-5">
            {filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => openPostModal(post)}
                    className="bg-theme-card rounded-lg p-4 border border-theme-border cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      {getStatusBadge(post.status)}
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-3 mb-3">
                      {post.content}
                    </p>
                    {post.scheduledDate && (
                      <p className="text-xs text-gray-400">
                        {format(new Date(post.scheduledDate), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-white">No posts</h3>
                <p className="mt-1 text-sm text-gray-400">
                  No posts found for the selected filter.
                </p>
              </div>
            )}
          </div>
          </PremiumCard>
        </div>
      </div>

      {/* Post Detail Modal */}
      {isPostModalOpen && selectedPost && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setIsPostModalOpen(false)}>
          <div className="bg-theme-card/95 backdrop-blur-sm rounded-xl p-6 w-full max-w-2xl shadow-large border border-theme-border max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Post Details</h3>
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="text-gray-400 hover:text-gray-300 opacity-90 hover:opacity-100 transition-all duration-200"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-3">
                  {getStatusBadge(selectedPost.status)}
                </div>
                <p className="text-gray-300 whitespace-pre-wrap">{selectedPost.content}</p>
              </div>

              {selectedPost.scheduledDate && (
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-1">Scheduled for:</p>
                  <p className="text-sm text-gray-400">
                    {format(convertToLocalTimezone(selectedPost.scheduledDate, selectedPost.client?.timezone), 'MMM d, yyyy h:mm a')}
                    {selectedPost.client?.timezone && (
                      <span className="ml-2 text-gray-500">({selectedPost.client.timezone})</span>
                    )}
                  </p>
                </div>
              )}

              {selectedPost.typefullyUrl && (
                <div>
                  <a
                    href={selectedPost.typefullyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-theme-link hover:text-blue-400 text-sm transition-colors duration-200"
                  >
                    <span>View in Typefully</span>
                    <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-1.5" />
                  </a>
                </div>
              )}

              {selectedPost.feedback && (
                <div className="p-3 bg-theme-bg rounded-lg border border-theme-border">
                  <p className="text-sm font-medium text-gray-300 mb-1">Feedback:</p>
                  <p className="text-sm text-gray-400">{selectedPost.feedback}</p>
                </div>
              )}

              {selectedPost.status === 'PENDING' && (
                <div className="flex flex-wrap gap-3 pt-4 border-t border-theme-border">
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedPost.id, 'APPROVED')
                      setIsPostModalOpen(false)
                    }}
                    className="flex-1 bg-approve-bg text-approve-text px-4 py-2 rounded-lg text-sm hover:bg-approve-hover border border-approve-border transition-colors duration-200 opacity-90 hover:opacity-100"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => openFeedbackModal('SUGGEST_CHANGES')}
                    className="flex-1 bg-suggest-bg text-suggest-text px-4 py-2 rounded-lg text-sm hover:bg-suggest-hover border border-suggest-border transition-colors duration-200 opacity-90 hover:opacity-100"
                  >
                    Suggest Changes
                  </button>
                  <button
                    onClick={() => openFeedbackModal('REJECTED')}
                    className="flex-1 bg-reject-bg text-reject-text px-4 py-2 rounded-lg text-sm hover:bg-reject-hover border border-reject-border transition-colors duration-200 opacity-90 hover:opacity-100"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {isFeedbackModalOpen && selectedPost && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => {setIsFeedbackModalOpen(false); setFeedback('');}}>
          <div className="bg-theme-card/95 backdrop-blur-sm rounded-xl p-6 w-full max-w-lg shadow-large border border-theme-border" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-white mb-4">
              {feedbackAction === 'SUGGEST_CHANGES' ? 'Suggest Changes' : 'Reject Post'}
            </h3>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
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
                  className="w-full rounded-md border border-theme-border bg-theme-bg text-gray-200 shadow-sm focus:border-theme-accent focus:ring-theme-accent p-3"
                  placeholder={feedbackAction === 'SUGGEST_CHANGES'
                    ? 'Enter your suggestions for improvement...'
                    : 'Enter rejection reason...'}
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsFeedbackModalOpen(false)
                    setFeedback('')
                  }}
                  className="px-4 py-2 border border-theme-border rounded-md text-gray-300 bg-theme-card hover:bg-theme-bg opacity-90 hover:opacity-100 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-md border opacity-90 hover:opacity-100 transition-colors duration-200 ${
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
      </Layout>
    </ErrorBoundary>
  )
}
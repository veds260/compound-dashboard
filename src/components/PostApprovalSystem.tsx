'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ListBulletIcon,
  CalendarIcon,
  DocumentTextIcon,
  ArrowsPointingOutIcon,
  ArrowPathIcon,
  RocketLaunchIcon,
  ChatBubbleBottomCenterTextIcon,
  ShareIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import DateTimePicker from './DateTimePicker'
import TweetMockup from './TweetMockup'
import CommentableTweetMockup from './CommentableTweetMockup'
import CommentList from './CommentList'
// import PostCalendar from './PostCalendar'
// import ContentDump from './ContentDump'

interface Post {
  id: string
  content: string
  tweetText?: string
  scheduledDate?: string
  typefullyUrl: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUGGEST_CHANGES' | 'PUBLISHED'
  feedback?: string
  media?: string
  createdAt: string
  client?: {
    id: string
    name: string
    email: string
    timezone?: string
    twitterHandle?: string
    profilePicture?: string
  }
}

interface PostApprovalSystemProps {
  userRole: 'AGENCY' | 'CLIENT'
  clientId?: string
  isAdmin?: boolean
  initialStatusFilter?: string
  onClientChange?: (clientId: string) => void
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

export default function PostApprovalSystem({ userRole, clientId, isAdmin, initialStatusFilter, onClientChange }: PostApprovalSystemProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [publishingPost, setPublishingPost] = useState<Post | null>(null)
  const [notingPost, setNotingPost] = useState<Post | null>(null)
  const [feedbackPost, setFeedbackPost] = useState<{id: string, action: 'SUGGEST_CHANGES' | 'REJECTED'} | null>(null)
  const [feedback, setFeedback] = useState('')
  const [tweetUrl, setTweetUrl] = useState('')
  const [writerNote, setWriterNote] = useState('')
  const [shareUrls, setShareUrls] = useState<{ [postId: string]: string }>({})
  const [mockupPost, setMockupPost] = useState<Post | null>(null)
  const [isMockupModalOpen, setIsMockupModalOpen] = useState(false)
  const [postComments, setPostComments] = useState<any[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [isEditingTweet, setIsEditingTweet] = useState(false)
  const [editedTweetText, setEditedTweetText] = useState('')
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [postMedia, setPostMedia] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<string>(clientId || '')
  const [clients, setClients] = useState<{id: string, name: string, timezone?: string}[]>([])
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || 'ALL')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [newPost, setNewPost] = useState({
    content: '',
    scheduledDate: null as Date | null,
    typefullyUrl: '',
    clientId: clientId || ''
  })
  const [editPost, setEditPost] = useState({
    content: '',
    scheduledDate: null as Date | null,
    typefullyUrl: ''
  })

  useEffect(() => {
    if ((userRole === 'AGENCY' || isAdmin) && !clientId) {
      fetchClients()
    }
    fetchPosts()
  }, [userRole, clientId, selectedClient, isAdmin])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      const data = await response.json()
      setClients(data.map((c: any) => ({ id: c.id, name: c.name, timezone: c.timezone })))
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchPosts = async () => {
    try {
      const url = userRole === 'CLIENT'
        ? `/api/posts?clientId=${clientId}`
        : selectedClient
        ? `/api/posts?clientId=${selectedClient}`
        : '/api/posts'

      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load posts')
      }

      setPosts(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load posts')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async (postId: string) => {
    setCommentsLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setPostComments(data)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setCommentsLoading(false)
    }
  }

  const handleOpenMockupModal = (post: Post) => {
    setMockupPost(post)
    setIsMockupModalOpen(true)
    setIsEditingTweet(false)
    setEditedTweetText(post.tweetText || '')
    fetchComments(post.id)
    // Parse media if it exists
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

  const handleSaveTweetEdit = async () => {
    if (!mockupPost) return

    try {
      const response = await fetch(`/api/posts/${mockupPost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tweetText: editedTweetText })
      })

      if (!response.ok) {
        throw new Error('Failed to update tweet')
      }

      const updatedPost = await response.json()
      setMockupPost(updatedPost)
      setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p))
      setIsEditingTweet(false)
      toast.success('Tweet updated successfully')
    } catch (error) {
      console.error('Error updating tweet:', error)
      toast.error('Failed to update tweet')
    }
  }

  const handleMediaUpload = async (files: FileList) => {
    if (!mockupPost) return
    if (postMedia.length + files.length > 4) {
      toast.error(`Cannot add ${files.length} file(s). Maximum 4 media items per post.`)
      return
    }

    setUploadingMedia(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch(`/api/posts/${mockupPost.id}/media`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload media')
      }

      const result = await response.json()
      setPostMedia(result.media)
      const addedCount = result.media.length - postMedia.length
      toast.success(`Added ${addedCount} media item(s)`)

      // Update the post in the list
      await fetchPosts()
    } catch (error: any) {
      console.error('Error uploading media:', error)
      toast.error(error.message || 'Failed to upload media')
    } finally {
      setUploadingMedia(false)
    }
  }

  const handleDeleteMedia = async (index: number) => {
    if (!mockupPost) return

    try {
      const response = await fetch(`/api/posts/${mockupPost.id}/media?index=${index}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete media')
      }

      const result = await response.json()
      setPostMedia(result.media)
      toast.success('Media removed')

      // Update the post in the list
      await fetchPosts()
    } catch (error) {
      console.error('Error deleting media:', error)
      toast.error('Failed to delete media')
    }
  }

  const handleStatusUpdate = async (postId: string, status: string, feedback?: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, feedback })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update post status')
      }

      const updatedPost = await response.json()
      setPosts(posts.map(p => p.id === postId ? updatedPost : p))

      // Map status to user-friendly messages
      const statusMessages: { [key: string]: string } = {
        'APPROVED': 'Post approved',
        'REJECTED': 'Post rejected',
        'SUGGEST_CHANGES': 'Feedback sent',
        'PENDING': 'Post updated',
        'PUBLISHED': 'Post published'
      }

      toast.success(statusMessages[status] || 'Post updated')
    } catch (error) {
      console.error('Error updating post:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update post')
    }
  }

  const handleGenerateShareLink = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/share`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to generate share link')
      }

      const { shareUrl } = await response.json()
      setShareUrls({ ...shareUrls, [postId]: shareUrl })

      // Copy to clipboard
      navigator.clipboard.writeText(shareUrl)
      toast.success('Share link copied to clipboard!')
    } catch (error) {
      console.error('Error generating share link:', error)
      toast.error('Failed to generate share link')
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Get the selected client's timezone
      const selectedClientData = clients.find(c => c.id === newPost.clientId)
      const clientTimezone = selectedClientData?.timezone
      const timezoneOffset = parseTimezoneOffset(clientTimezone)

      // Convert selected date/time to UTC using client's timezone
      let scheduledDateISO = ''
      if (newPost.scheduledDate) {
        // Extract date/time components and treat them as being in the client's timezone
        const localDate = new Date(newPost.scheduledDate)
        const year = localDate.getFullYear()
        const month = localDate.getMonth()
        const day = localDate.getDate()
        const hours = localDate.getHours()
        const minutes = localDate.getMinutes()

        // Create UTC date by subtracting the timezone offset
        const utcDate = new Date(Date.UTC(year, month, day, hours - timezoneOffset, minutes, 0, 0))
        scheduledDateISO = utcDate.toISOString()
      }

      const postData = {
        content: newPost.content,
        typefullyUrl: newPost.typefullyUrl,
        clientId: newPost.clientId,
        scheduledDate: scheduledDateISO
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create post')
      }

      const createdPost = await response.json()
      setPosts([createdPost, ...posts])
      setIsModalOpen(false)
      setNewPost({ content: '', scheduledDate: null, typefullyUrl: '', clientId: clientId || '' })
      toast.success('Post created successfully')
    } catch (error) {
      console.error('Error creating post:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create post')
    }
  }

  const handleEditClick = (post: Post) => {
    setEditingPost(post)

    // Convert UTC time to client's timezone for display in picker
    let displayDate: Date | null = null
    if (post.scheduledDate) {
      try {
        const utcDate = new Date(post.scheduledDate)
        const offset = parseTimezoneOffset(post.client?.timezone)
        console.log(`[Edit Click] UTC from DB: ${utcDate.toISOString()}`)
        console.log(`[Edit Click] Timezone: ${post.client?.timezone}, Offset: ${offset}`)
        // Add offset in milliseconds to UTC timestamp
        const offsetMs = offset * 60 * 60 * 1000
        displayDate = new Date(utcDate.getTime() + offsetMs)
        console.log(`[Edit Click] Display date for picker: ${displayDate.toISOString()}`)
      } catch (error) {
        console.error('[Edit Click] Error converting date:', error, post.scheduledDate)
      }
    }

    setEditPost({
      content: post.content,
      scheduledDate: displayDate,
      typefullyUrl: post.typefullyUrl
    })
    setIsEditModalOpen(true)
  }

  const handleEditPost = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingPost) return

    try {
      // Convert selected date/time to UTC using client's timezone
      let scheduledDateISO = ''
      if (editPost.scheduledDate) {
        // Get client's timezone offset
        const timezoneOffset = parseTimezoneOffset(editingPost.client?.timezone)

        // Extract date/time components and treat them as being in the client's timezone
        const localDate = new Date(editPost.scheduledDate)
        const year = localDate.getFullYear()
        const month = localDate.getMonth()
        const day = localDate.getDate()
        const hours = localDate.getHours()
        const minutes = localDate.getMinutes()

        // Create UTC date by subtracting the timezone offset
        const utcDate = new Date(Date.UTC(year, month, day, hours - timezoneOffset, minutes, 0, 0))
        scheduledDateISO = utcDate.toISOString()
      }

      const postData = {
        content: editPost.content,
        typefullyUrl: editPost.typefullyUrl,
        scheduledDate: scheduledDateISO
      }

      const response = await fetch(`/api/posts/${editingPost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update post')
      }

      const updatedPost = await response.json()
      setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p))
      setIsEditModalOpen(false)
      setEditingPost(null)
      toast.success('Post updated successfully')
    } catch (error) {
      console.error('Error updating post:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update post')
    }
  }

  const handleDeletePost = async (postId: string, postContent: string) => {
    // Confirm before deleting
    if (!confirm(`Are you sure you want to delete this post?\n\n"${postContent.substring(0, 100)}${postContent.length > 100 ? '...' : ''}"`)) {
      return
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete post')
      }

      // Remove post from state
      setPosts(posts.filter(p => p.id !== postId))
      toast.success('Post deleted successfully')
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete post')
    }
  }

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!feedbackPost) return

    await handleStatusUpdate(feedbackPost.id, feedbackPost.action, feedback)
    setIsFeedbackModalOpen(false)
    setFeedbackPost(null)
    setFeedback('')
  }

  const openFeedbackModal = (postId: string, action: 'SUGGEST_CHANGES' | 'REJECTED') => {
    setFeedbackPost({ id: postId, action })
    setFeedback('')
    setIsFeedbackModalOpen(true)
  }

  const handleMarkUpdated = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/mark-updated`, {
        method: 'PUT'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to mark as updated')
      }

      const result = await response.json()
      setPosts(posts.map(p => p.id === postId ? result.post : p))
      toast.success('Post marked as updated and sent back for review')
    } catch (error) {
      console.error('Error marking post as updated:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to mark as updated')
    }
  }

  const handleMarkPublished = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!publishingPost) return

    try {
      const response = await fetch(`/api/posts/${publishingPost.id}/mark-published`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tweetUrl: tweetUrl || undefined })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to mark as published')
      }

      const result = await response.json()
      setPosts(posts.map(p => p.id === publishingPost.id ? result.post : p))
      setIsPublishModalOpen(false)
      setPublishingPost(null)
      setTweetUrl('')
      toast.success('Post marked as published')
    } catch (error) {
      console.error('Error marking post as published:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to mark as published')
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!notingPost || !writerNote.trim()) return

    try {
      const response = await fetch(`/api/posts/${notingPost.id}/add-writer-note`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ note: writerNote })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add note')
      }

      const result = await response.json()
      setPosts(posts.map(p => p.id === notingPost.id ? result.post : p))
      setIsNoteModalOpen(false)
      setNotingPost(null)
      setWriterNote('')
      toast.success('Note added successfully')
    } catch (error) {
      console.error('Error adding note:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add note')
    }
  }

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
      PENDING: 'Pending',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      SUGGEST_CHANGES: 'Suggest Changes',
      PUBLISHED: 'Published'
    }

    const Icon = icons[status as keyof typeof icons]
    const style = styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200'
    const label = labels[status as keyof typeof labels] || status

    if (!Icon) {
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
          {label}
        </span>
      )
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
        <Icon className="w-4 h-4 mr-1" />
        {label}
      </span>
    )
  }

  const filteredPosts = (statusFilter === 'ALL'
    ? posts
    : posts.filter(post => post.status === statusFilter)
  ).sort((a, b) => {
    const dateA = new Date(a.scheduledDate || a.createdAt).getTime()
    const dateB = new Date(b.scheduledDate || b.createdAt).getTime()
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-white">Content Review</h2>

          {(userRole === 'AGENCY' || isAdmin) && !clientId && (
            <select
              value={selectedClient}
              onChange={(e) => {
                setSelectedClient(e.target.value)
                if (onClientChange) {
                  onClientChange(e.target.value)
                }
              }}
              className="rounded-md border border-theme-border bg-theme-card text-gray-300 text-sm focus:border-theme-accent focus:ring-theme-accent px-3 py-2"
            >
              <option value="">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          )}
        </div>

        {userRole === 'AGENCY' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-theme-accent text-white px-4 py-2 rounded-lg hover:bg-[#C73333] flex items-center space-x-2 transition-all duration-200 opacity-90 hover:opacity-100"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Post</span>
          </button>
        )}
      </div>

      {/* Status Filtering Tabs and Sort */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
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
            Pending
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
            onClick={() => setStatusFilter('SUGGEST_CHANGES')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap opacity-90 hover:opacity-100 ${
              statusFilter === 'SUGGEST_CHANGES'
                ? 'bg-theme-accent text-white shadow-md'
                : 'bg-theme-card border border-theme-border text-gray-400 hover:text-gray-300'
            }`}
          >
            Suggest Changes
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

        {/* Sort Dropdown */}
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-400 whitespace-nowrap">Sort by:</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="rounded-md border border-theme-border bg-theme-card text-gray-300 text-sm focus:border-theme-accent focus:ring-theme-accent px-3 py-2"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* List View */}
      <div className="bg-theme-card backdrop-blur-sm shadow-soft rounded-xl border border-theme-border overflow-hidden">
          <div className="divide-y divide-theme-border">
            {filteredPosts.map((post) => {
              const hasTweetText = post.tweetText && post.tweetText.trim().length > 0

              return (
            <div key={post.id} className="p-6 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    {getStatusBadge(post.status)}
                    {userRole === 'AGENCY' && post.client && (
                      <span className="text-sm text-gray-400">
                        Client: {post.client.name}
                      </span>
                    )}
                  </div>

                  {/* Show clickable card that opens mockup modal */}
                  <div className="mb-4">
                    <div
                      onClick={() => handleOpenMockupModal(post)}
                      className="p-4 bg-theme-bg rounded-lg border border-theme-border cursor-pointer hover:border-theme-accent transition-colors group"
                    >
                      <p className="text-gray-300 mb-2 line-clamp-3">{post.content}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">
                          {hasTweetText ? 'Click to preview tweet' : 'Click to view details'}
                        </span>
                        <ArrowsPointingOutIcon className="w-4 h-4 text-gray-400 group-hover:text-theme-accent transition-colors" />
                      </div>
                    </div>
                  </div>

                  {post.scheduledDate && (
                    <p className="text-sm text-gray-400 mb-3">
                      Scheduled for: {(() => {
                        try {
                          const utcDate = new Date(post.scheduledDate)
                          const offset = parseTimezoneOffset(post.client?.timezone)
                          console.log(`[Display] Post: ${post.content.substring(0, 30)}...`)
                          console.log(`[Display] UTC Date from DB: ${utcDate.toISOString()}`)
                          console.log(`[Display] Timezone: ${post.client?.timezone}, Offset: ${offset} hours`)

                          // Get UTC components
                          const year = utcDate.getUTCFullYear()
                          const month = utcDate.getUTCMonth()
                          const day = utcDate.getUTCDate()
                          const hours = utcDate.getUTCHours()
                          const minutes = utcDate.getUTCMinutes()

                          // Add offset to get local time
                          const localHours = hours + offset

                          // Create new date with local time components (not using UTC methods)
                          const localDate = new Date(year, month, day, localHours, minutes)
                          console.log(`[Display] Local Date: ${localDate.toString()}`)

                          const formatted = format(localDate, 'MMM d, yyyy h:mm a')
                          console.log(`[Display] Formatted: ${formatted}`)
                          return formatted
                        } catch (error) {
                          console.error('[Display] Error formatting date:', error, post.scheduledDate)
                          return 'Invalid date'
                        }
                      })()}
                      {post.client?.timezone && (
                        <span className="ml-2 text-gray-500">({post.client.timezone})</span>
                      )}
                    </p>
                  )}

                  <div className="flex items-center space-x-4">
                    <a
                      href={post.typefullyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-theme-link hover:text-blue-400 text-sm transition-colors duration-200"
                    >
                      <span>View in Typefully</span>
                      <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-1.5" />
                    </a>

                    {(userRole === 'AGENCY' || isAdmin) && (
                      <>
                        <button
                          onClick={() => handleEditClick(post)}
                          className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm"
                        >
                          <PencilIcon className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id, post.content)}
                          className="inline-flex items-center text-red-400 hover:text-red-300 text-sm"
                        >
                          <TrashIcon className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>

                  {post.feedback && (
                    <div className="mt-4 p-3 bg-theme-bg rounded-lg">
                      <p className="text-sm font-medium text-gray-300 mb-1">Feedback:</p>
                      <p className="text-sm text-gray-400 whitespace-pre-wrap">{post.feedback}</p>
                    </div>
                  )}
                </div>

                {/* Writer workflow buttons for AGENCY/ADMIN */}
                {(userRole === 'AGENCY' || isAdmin) && post.status !== 'PENDING' && (
                  <div className="flex flex-col space-y-2 ml-4 min-w-[140px]">
                    {post.status === 'SUGGEST_CHANGES' && (
                      <button
                        onClick={() => handleMarkUpdated(post.id)}
                        className="w-full bg-green-900/30 text-green-300 border border-green-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-900/50 transition-colors duration-200"
                      >
                        Changes Done
                      </button>
                    )}

                    {post.status === 'APPROVED' && (
                      <button
                        onClick={() => {
                          setPublishingPost(post)
                          setIsPublishModalOpen(true)
                        }}
                        className="w-full bg-purple-900/30 text-purple-300 border border-purple-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-900/50 transition-colors duration-200"
                      >
                        Mark Published
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setNotingPost(post)
                        setIsNoteModalOpen(true)
                      }}
                      className="w-full bg-yellow-900/30 text-yellow-300 border border-yellow-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-900/50 transition-colors duration-200"
                    >
                      Add Note
                    </button>
                  </div>
                )}

                {/* Client/Admin approval buttons */}
                {(userRole === 'CLIENT' || isAdmin) && post.status === 'PENDING' && (
                  <div className="flex flex-col space-y-2 ml-4 min-w-[140px]">
                    <button
                      onClick={() => handleStatusUpdate(post.id, 'APPROVED')}
                      className="w-full bg-approve-bg text-approve-text border border-approve-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-approve-hover transition-colors duration-200"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => openFeedbackModal(post.id, 'SUGGEST_CHANGES')}
                      className="w-full bg-suggest-bg text-suggest-text border border-suggest-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-suggest-hover transition-colors duration-200"
                    >
                      Suggest Changes
                    </button>
                    <button
                      onClick={() => openFeedbackModal(post.id, 'REJECTED')}
                      className="w-full bg-reject-bg text-reject-text border border-reject-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-reject-hover transition-colors duration-200"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
              )
            })}

            {filteredPosts.length === 0 && (
              <div className="text-center py-12">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-white">No posts</h3>
                <p className="mt-1 text-sm text-gray-400">
                  {statusFilter !== 'ALL'
                    ? `No posts with status "${statusFilter}".`
                    : userRole === 'AGENCY'
                    ? 'Create your first post for client approval.'
                    : 'No posts waiting for your approval.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

      {/* Create Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setIsModalOpen(false)}>
          <div className="bg-theme-card/95 backdrop-blur-sm rounded-xl p-6 w-full max-w-lg shadow-large border border-theme-border" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-white mb-4">Create New Post</h3>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Client *
                </label>
                <select
                  required
                  value={newPost.clientId}
                  onChange={(e) => setNewPost({ ...newPost, clientId: e.target.value })}
                  className="w-full rounded-md border border-theme-border bg-theme-bg text-gray-200 shadow-sm focus:border-theme-accent focus:ring-theme-accent px-3 py-2"
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Post Content *
                </label>
                <textarea
                  required
                  rows={4}
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="w-full rounded-md border border-theme-border bg-theme-bg text-gray-200 placeholder-gray-500 shadow-sm focus:border-theme-accent focus:ring-theme-accent p-3"
                  placeholder="Enter the post content..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Typefully URL *
                </label>
                <input
                  type="url"
                  required
                  value={newPost.typefullyUrl}
                  onChange={(e) => setNewPost({ ...newPost, typefullyUrl: e.target.value })}
                  className="w-full rounded-md border border-theme-border bg-theme-bg text-gray-200 placeholder-gray-500 shadow-sm focus:border-theme-accent focus:ring-theme-accent px-3 py-2"
                  placeholder="https://typefully.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Scheduled Date & Time (optional)
                </label>
                <DateTimePicker
                  value={newPost.scheduledDate}
                  onChange={(date) => setNewPost({ ...newPost, scheduledDate: date })}
                  placeholder="Select date and time"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-theme-border rounded-md text-gray-300 bg-theme-card hover:bg-theme-bg opacity-90 hover:opacity-100 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-theme-accent text-white rounded-md hover:bg-[#C73333] opacity-90 hover:opacity-100 transition-colors duration-200"
                >
                  Create Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {isEditModalOpen && editingPost && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => {
          setIsEditModalOpen(false)
          setEditingPost(null)
        }}>
          <div className="bg-theme-card/95 backdrop-blur-sm rounded-xl p-6 w-full max-w-lg shadow-large border border-theme-border" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-white mb-4">Edit Post</h3>

            <form onSubmit={handleEditPost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Post Content *
                </label>
                <textarea
                  required
                  rows={4}
                  value={editPost.content}
                  onChange={(e) => setEditPost({ ...editPost, content: e.target.value })}
                  className="w-full rounded-md border border-theme-border bg-theme-bg text-gray-200 placeholder-gray-500 shadow-sm focus:border-theme-accent focus:ring-theme-accent p-3"
                  placeholder="Enter the post content..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Typefully URL *
                </label>
                <input
                  type="url"
                  required
                  value={editPost.typefullyUrl}
                  onChange={(e) => setEditPost({ ...editPost, typefullyUrl: e.target.value })}
                  className="w-full rounded-md border border-theme-border bg-theme-bg text-gray-200 placeholder-gray-500 shadow-sm focus:border-theme-accent focus:ring-theme-accent px-3 py-2"
                  placeholder="https://typefully.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Scheduled Date & Time (optional)
                </label>
                <DateTimePicker
                  value={editPost.scheduledDate}
                  onChange={(date) => setEditPost({ ...editPost, scheduledDate: date })}
                  placeholder="Select date and time"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setEditingPost(null)
                  }}
                  className="px-4 py-2 border border-theme-border rounded-md text-gray-300 bg-theme-card hover:bg-theme-bg opacity-90 hover:opacity-100 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-theme-accent text-white rounded-md hover:bg-[#C73333] opacity-90 hover:opacity-100 transition-colors duration-200"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {isFeedbackModalOpen && feedbackPost && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => {
          setIsFeedbackModalOpen(false)
          setFeedbackPost(null)
          setFeedback('')
        }}>
          <div className="bg-theme-card/95 backdrop-blur-sm rounded-xl p-6 w-full max-w-lg shadow-large border border-theme-border" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-white mb-4">
              {feedbackPost.action === 'SUGGEST_CHANGES' ? 'Suggest Changes' : 'Reject Post'}
            </h3>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {feedbackPost.action === 'SUGGEST_CHANGES'
                    ? 'Provide feedback for improvement *'
                    : 'Provide rejection reason (optional)'}
                </label>
                <textarea
                  required={feedbackPost.action === 'SUGGEST_CHANGES'}
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full rounded-md border border-theme-border bg-theme-bg text-gray-200 placeholder-gray-500 shadow-sm focus:border-theme-accent focus:ring-theme-accent p-3"
                  placeholder={feedbackPost.action === 'SUGGEST_CHANGES'
                    ? 'Enter your suggestions for improvement...'
                    : 'Enter rejection reason...'}
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsFeedbackModalOpen(false)
                    setFeedbackPost(null)
                    setFeedback('')
                  }}
                  className="px-4 py-2 border border-theme-border rounded-md text-gray-300 bg-theme-card hover:bg-theme-bg opacity-90 hover:opacity-100 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-md border opacity-90 hover:opacity-100 transition-colors duration-200 ${
                    feedbackPost.action === 'SUGGEST_CHANGES'
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

      {/* Mark as Published Modal */}
      {isPublishModalOpen && publishingPost && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => {
          setIsPublishModalOpen(false)
          setPublishingPost(null)
          setTweetUrl('')
        }}>
          <div className="bg-theme-card/95 backdrop-blur-sm rounded-xl p-6 w-full max-w-lg shadow-large border border-theme-border" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-white mb-4">Mark as Published</h3>

            <form onSubmit={handleMarkPublished} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tweet/Post URL (optional)
                </label>
                <input
                  type="url"
                  value={tweetUrl}
                  onChange={(e) => setTweetUrl(e.target.value)}
                  className="w-full rounded-md border border-theme-border bg-theme-bg text-gray-200 placeholder-gray-500 shadow-sm focus:border-theme-accent focus:ring-theme-accent px-3 py-2"
                  placeholder="https://twitter.com/..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  Add the URL where this post was published (optional)
                </p>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsPublishModalOpen(false)
                    setPublishingPost(null)
                    setTweetUrl('')
                  }}
                  className="px-4 py-2 border border-theme-border rounded-md text-gray-300 bg-theme-card hover:bg-theme-bg opacity-90 hover:opacity-100 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-900/30 text-purple-300 border border-purple-800 rounded-md hover:bg-purple-900/50 opacity-90 hover:opacity-100 transition-colors duration-200"
                >
                  Mark as Published
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {isNoteModalOpen && notingPost && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => {
          setIsNoteModalOpen(false)
          setNotingPost(null)
          setWriterNote('')
        }}>
          <div className="bg-theme-card/95 backdrop-blur-sm rounded-xl p-6 w-full max-w-lg shadow-large border border-theme-border" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-white mb-4">Add Writer Note</h3>

            <form onSubmit={handleAddNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Note *
                </label>
                <textarea
                  required
                  rows={4}
                  value={writerNote}
                  onChange={(e) => setWriterNote(e.target.value)}
                  className="w-full rounded-md border border-theme-border bg-theme-bg text-gray-200 placeholder-gray-500 shadow-sm focus:border-theme-accent focus:ring-theme-accent p-3"
                  placeholder="Enter note from client feedback (Telegram, chat, etc.)..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  Add notes from external feedback channels for future reference
                </p>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsNoteModalOpen(false)
                    setNotingPost(null)
                    setWriterNote('')
                  }}
                  className="px-4 py-2 border border-theme-border rounded-md text-gray-300 bg-theme-card hover:bg-theme-bg opacity-90 hover:opacity-100 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-yellow-900/30 text-yellow-300 border border-yellow-800 rounded-md hover:bg-yellow-900/50 opacity-90 hover:opacity-100 transition-colors duration-200"
                >
                  Add Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tweet Mockup Modal */}
      {isMockupModalOpen && mockupPost && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => {
          setIsMockupModalOpen(false)
          setMockupPost(null)
        }}>
          <div className="bg-theme-card/95 backdrop-blur-sm rounded-xl w-full max-w-6xl shadow-large border border-theme-border max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-theme-card border-b border-theme-border px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-medium text-white">Post Preview</h3>
                {postComments.length > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    {postComments.filter(c => !c.resolved).length} comments
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setIsMockupModalOpen(false)
                  setMockupPost(null)
                  setPostComments([])
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {(() => {
                const hasTweetText = mockupPost.tweetText && mockupPost.tweetText.trim().length > 0

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-[600px,1fr] gap-4">
                    {/* Left side - Tweet Preview with Commenting */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-400">
                          {hasTweetText ? 'Tweet Preview' : 'Content Overview'}
                        </h4>
                        {hasTweetText && userRole === 'AGENCY' && !isEditingTweet && (
                          <button
                            onClick={() => setIsEditingTweet(true)}
                            className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded-md hover:bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/30 transition-all"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        )}
                      </div>
                      {hasTweetText ? (
                        isEditingTweet ? (
                          <div className="space-y-3">
                            <div className="bg-theme-bg border border-theme-border rounded-lg p-4">
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Edit Tweet Text
                              </label>
                              <textarea
                                value={editedTweetText}
                                onChange={(e) => setEditedTweetText(e.target.value)}
                                className="w-full h-64 rounded-md border border-theme-border bg-gray-900 text-gray-200 placeholder-gray-500 p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                                placeholder="Enter tweet text..."
                              />
                              <p className="text-xs text-gray-500 mt-2">
                                {editedTweetText.length} characters
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={handleSaveTweetEdit}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                              >
                                Save Changes
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditingTweet(false)
                                  setEditedTweetText(mockupPost.tweetText || '')
                                }}
                                className="flex-1 bg-theme-bg text-gray-300 border border-theme-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <CommentableTweetMockup
                            postId={mockupPost.id}
                            clientName={mockupPost.client?.name || 'Client'}
                            twitterHandle={mockupPost.client?.twitterHandle}
                            profilePicture={mockupPost.client?.profilePicture}
                            tweetText={mockupPost.tweetText || ''}
                            timestamp={mockupPost.scheduledDate ? new Date(mockupPost.scheduledDate) : undefined}
                            onCommentAdded={() => fetchComments(mockupPost.id)}
                            media={postMedia}
                          />
                        )
                      ) : (
                        <div className="space-y-4">
                          <div className="p-6 bg-theme-bg rounded-lg border border-theme-border">
                            <p className="text-sm text-gray-400 mb-2">Topic Outline:</p>
                            <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{mockupPost.content}</p>
                          </div>
                          <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
                            <p className="text-sm text-blue-300">
                              <span className="font-semibold">Note:</span> Tweet preview not available. Click "Open in Typefully" to view and edit the full content.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Comments Section Below Tweet */}
                      {hasTweetText && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-gray-400 mb-3">Comments</h4>
                          <div className="bg-theme-bg rounded-lg border border-theme-border p-4">
                            {commentsLoading ? (
                              <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                              </div>
                            ) : (
                              <CommentList
                                comments={postComments}
                                onCommentUpdate={() => fetchComments(mockupPost.id)}
                                currentUserId={userRole === 'CLIENT' ? clientId || '' : ''}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right side - Post Details */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Post Details</h4>
                      <div className="space-y-4">
                        <div>
                          <dt className="text-xs font-medium text-gray-500 mb-1">Status</dt>
                          <dd>{getStatusBadge(mockupPost.status)}</dd>
                        </div>

                        {mockupPost.scheduledDate && (
                          <div>
                            <dt className="text-xs font-medium text-gray-500 mb-1">Scheduled For</dt>
                            <dd className="text-sm text-gray-300">
                              {(() => {
                                try {
                                  const utcDate = new Date(mockupPost.scheduledDate)
                                  const offset = parseTimezoneOffset(mockupPost.client?.timezone)
                                  const year = utcDate.getUTCFullYear()
                                  const month = utcDate.getUTCMonth()
                                  const day = utcDate.getUTCDate()
                                  const hours = utcDate.getUTCHours()
                                  const minutes = utcDate.getUTCMinutes()
                                  const localHours = hours + offset
                                  const localDate = new Date(year, month, day, localHours, minutes)
                                  return format(localDate, 'MMM d, yyyy h:mm a')
                                } catch (error) {
                                  return 'Invalid date'
                                }
                              })()}
                              {mockupPost.client?.timezone && (
                                <span className="ml-2 text-gray-500">({mockupPost.client.timezone})</span>
                              )}
                            </dd>
                          </div>
                        )}

                        {mockupPost.feedback && (
                          <div>
                            <dt className="text-xs font-medium text-gray-500 mb-1">Feedback</dt>
                            <dd className="text-sm text-gray-300 whitespace-pre-wrap bg-theme-bg p-3 rounded-lg">
                              {mockupPost.feedback}
                            </dd>
                          </div>
                        )}

                        {/* Media Upload Section */}
                        {(userRole === 'AGENCY' || isAdmin) && (
                          <div className="space-y-2 pb-4 border-b border-theme-border">
                            <h4 className="text-xs font-medium text-gray-500 mb-2">Media ({postMedia.length}/4)</h4>

                            {/* Media Grid */}
                            {postMedia.length > 0 && (
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                {postMedia.map((item: any, index: number) => (
                                  <div key={index} className="relative group">
                                    <img
                                      src={item.data}
                                      alt={item.name || `Media ${index + 1}`}
                                      className="w-full h-20 object-cover rounded-lg border border-theme-border"
                                    />
                                    <button
                                      onClick={() => handleDeleteMedia(index)}
                                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Upload Button */}
                            {postMedia.length < 4 && (
                              <label className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium w-full justify-center cursor-pointer">
                                <PhotoIcon className="w-4 h-4 mr-2" />
                                <span>{uploadingMedia ? 'Uploading...' : 'Add Media'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  disabled={uploadingMedia}
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files) {
                                      handleMediaUpload(e.target.files)
                                      e.target.value = ''
                                    }
                                  }}
                                />
                              </label>
                            )}
                            <p className="text-xs text-gray-500">Max 3MB per image, 4 images total</p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <a
                            href={mockupPost.typefullyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium w-full justify-center"
                          >
                            <span>Open in Typefully</span>
                            <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-2" />
                          </a>

                          {(userRole === 'AGENCY' || isAdmin) && (
                            <button
                              onClick={() => handleGenerateShareLink(mockupPost.id)}
                              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium w-full justify-center"
                            >
                              <ShareIcon className="w-4 h-4 mr-2" />
                              <span>{shareUrls[mockupPost.id] ? 'Copy Share Link' : 'Generate Share Link'}</span>
                            </button>
                          )}
                        </div>

                        {/* Client/Admin approval buttons */}
                        {(userRole === 'CLIENT' || isAdmin) && mockupPost.status === 'PENDING' && (
                          <div className="space-y-2 pt-4 border-t border-theme-border">
                            <button
                              onClick={() => {
                                handleStatusUpdate(mockupPost.id, 'APPROVED')
                                setIsMockupModalOpen(false)
                              }}
                              className="w-full bg-approve-bg text-approve-text border border-approve-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-approve-hover transition-colors duration-200"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                openFeedbackModal(mockupPost.id, 'SUGGEST_CHANGES')
                                setIsMockupModalOpen(false)
                              }}
                              className="w-full bg-suggest-bg text-suggest-text border border-suggest-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-suggest-hover transition-colors duration-200"
                            >
                              Suggest Changes
                            </button>
                            <button
                              onClick={() => {
                                openFeedbackModal(mockupPost.id, 'REJECTED')
                                setIsMockupModalOpen(false)
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
    </div>
  )
}
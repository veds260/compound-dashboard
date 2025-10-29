'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import CommentableTweetMockup from '@/components/CommentableTweetMockup'
import { CheckCircleIcon, XCircleIcon, PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

interface Post {
  id: string
  content: string
  tweetText: string | null
  scheduledDate: string | null
  typefullyUrl: string
  status: string
  feedback: string | null
  client: {
    id: string
    name: string
    twitterHandle: string | null
    profilePicture: string | null
  }
}

export default function SharedPostPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const { data: session, status: sessionStatus } = useSession()

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    fetchPost()
  }, [token])

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/share/${token}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('This link is invalid or has been revoked.')
        } else {
          setError('Failed to load post.')
        }
        setLoading(false)
        return
      }

      const data = await response.json()
      setPost(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching post:', error)
      setError('Failed to load post.')
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (status: 'APPROVED' | 'REJECTED' | 'SUGGEST_CHANGES', feedback?: string) => {
    if (!post) return

    // Check if user is authenticated
    if (!session) {
      setShowAuthModal(true)
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/share/${token}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, feedback })
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      const updatedPost = await response.json()
      setPost(updatedPost)

      const statusMessages = {
        APPROVED: 'Post approved! ✅',
        REJECTED: 'Post rejected',
        SUGGEST_CHANGES: 'Changes requested'
      }

      toast.success(statusMessages[status])
      setShowFeedbackModal(false)
      setFeedbackText('')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const handleSuggestChangesClick = () => {
    if (!session) {
      setShowAuthModal(true)
      return
    }
    setShowFeedbackModal(true)
  }

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) {
      toast.error('Please provide feedback')
      return
    }
    handleStatusUpdate('SUGGEST_CHANGES', feedbackText)
  }

  const handleCommentsUpdate = () => {
    // Refresh post data when comments are added
    fetchPost()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            {error || 'Post not found'}
          </h1>
          <p className="text-gray-400">
            This share link may have been revoked or deleted.
          </p>
        </div>
      </div>
    )
  }

  const hasTweetText = post.tweetText && post.tweetText.trim() !== ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-8 mb-8">
          <div className="flex items-center gap-6 mb-6">
            {post.client.profilePicture ? (
              <img
                src={post.client.profilePicture}
                alt={post.client.name}
                className="w-20 h-20 rounded-full border-4 border-blue-500 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl border-4 border-blue-500 shadow-lg">
                {post.client.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">{post.client.name}</h1>
              {post.client.twitterHandle && (
                <p className="text-blue-400 text-lg">@{post.client.twitterHandle}</p>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gray-900/50 border border-gray-700 backdrop-blur-sm">
            <span className="text-sm font-medium text-gray-300">Current Status:</span>
            <span className={`text-sm font-bold px-3 py-1 rounded-lg ${
              post.status === 'APPROVED' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
              post.status === 'REJECTED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              post.status === 'SUGGEST_CHANGES' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
              'bg-gray-500/20 text-gray-300 border border-gray-500/30'
            }`}>
              {post.status === 'SUGGEST_CHANGES' ? 'Changes Requested' : post.status}
            </span>
          </div>
        </div>

        {/* Tweet Mockup or Content */}
        <div className="mb-8">
          {hasTweetText ? (
            <div className="flex justify-center">
              <CommentableTweetMockup
                postId={post.id}
                clientName={post.client.name}
                twitterHandle={post.client.twitterHandle || undefined}
                profilePicture={post.client.profilePicture || undefined}
                tweetText={post.tweetText || ''}
                timestamp={post.scheduledDate ? new Date(post.scheduledDate) : undefined}
                onCommentAdded={handleCommentsUpdate}
                shareToken={token}
              />
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-700 p-8">
              <p className="text-sm font-semibold text-gray-400 mb-3">Content:</p>
              <p className="text-gray-100 text-lg whitespace-pre-wrap leading-relaxed">{post.content}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-700 p-8 mb-8">
          <h3 className="text-xl font-bold text-white mb-6">Review Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => handleStatusUpdate('APPROVED')}
              disabled={updating || post.status === 'APPROVED'}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg disabled:transform-none"
            >
              <CheckCircleIcon className="w-6 h-6" />
              Approve
            </button>

            <button
              onClick={handleSuggestChangesClick}
              disabled={updating || post.status === 'SUGGEST_CHANGES'}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg disabled:transform-none"
            >
              <PencilSquareIcon className="w-6 h-6" />
              Suggest Changes
            </button>

            <button
              onClick={() => handleStatusUpdate('REJECTED')}
              disabled={updating || post.status === 'REJECTED'}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg disabled:transform-none"
            >
              <XCircleIcon className="w-6 h-6" />
              Reject
            </button>

            <a
              href={post.typefullyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in Typefully
            </a>
          </div>
        </div>

        {/* Feedback */}
        {post.feedback && (
          <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border-2 border-yellow-600/50 rounded-2xl shadow-xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
              <PencilSquareIcon className="w-7 h-7" />
              Feedback:
            </h3>
            <p className="text-gray-100 text-lg whitespace-pre-wrap leading-relaxed">{post.feedback}</p>
          </div>
        )}

        {/* Powered by footer */}
        <div className="text-center text-gray-500 text-sm pt-8 border-t border-gray-800">
          <p>Shared securely via Social Media Dashboard</p>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 max-w-2xl w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <PencilSquareIcon className="w-7 h-7 text-yellow-400" />
                Suggest Changes
              </h3>
              <button
                onClick={() => {
                  setShowFeedbackModal(false)
                  setFeedbackText('')
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-7 h-7" />
              </button>
            </div>
            <p className="text-gray-300 mb-4">Please provide detailed feedback on what changes you'd like to see:</p>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Enter your feedback here..."
              className="w-full h-40 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 transition-all resize-none"
            />
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setShowFeedbackModal(false)
                  setFeedbackText('')
                }}
                className="px-6 py-3 text-gray-300 hover:text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={updating || !feedbackText.trim()}
                className="px-8 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 disabled:from-gray-700 disabled:to-gray-800 text-white rounded-xl font-semibold transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Required Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 max-w-md w-full p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-500/20 mb-6">
                <svg className="h-8 w-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Authentication Required</h3>
              <p className="text-gray-300 mb-8">
                You need to be logged in to change the status of this post. Please sign in to continue.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push(`/auth/signin?callbackUrl=/share/${token}`)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="w-full px-6 py-3 text-gray-300 hover:text-white font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

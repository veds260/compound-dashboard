'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import CommentableTweetMockup from '@/components/CommentableTweetMockup'
import { CheckCircleIcon, XCircleIcon, PencilSquareIcon } from '@heroicons/react/24/solid'
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

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

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

  const handleStatusUpdate = async (status: 'APPROVED' | 'REJECTED' | 'SUGGEST_CHANGES') => {
    if (!post) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/share/${token}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
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
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    } finally {
      setUpdating(false)
    }
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
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {post.client.profilePicture && (
              <img
                src={post.client.profilePicture}
                alt={post.client.name}
                className="w-12 h-12 rounded-full"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">{post.client.name}</h1>
              {post.client.twitterHandle && (
                <p className="text-gray-400">@{post.client.twitterHandle}</p>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800">
            <span className="text-sm font-medium text-gray-400">Status:</span>
            <span className={`text-sm font-semibold ${
              post.status === 'APPROVED' ? 'text-green-400' :
              post.status === 'REJECTED' ? 'text-red-400' :
              post.status === 'SUGGEST_CHANGES' ? 'text-yellow-400' :
              'text-gray-300'
            }`}>
              {post.status === 'SUGGEST_CHANGES' ? 'Changes Requested' : post.status}
            </span>
          </div>
        </div>

        {/* Tweet Mockup or Content */}
        <div className="mb-8">
          {hasTweetText ? (
            <CommentableTweetMockup
              postId={post.id}
              clientName={post.client.name}
              twitterHandle={post.client.twitterHandle}
              profilePicture={post.client.profilePicture}
              tweetText={post.tweetText || ''}
              timestamp={post.scheduledDate ? new Date(post.scheduledDate) : undefined}
              onCommentAdded={handleCommentsUpdate}
              shareToken={token}
            />
          ) : (
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-sm text-gray-400 mb-2">Content:</p>
              <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{post.content}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => handleStatusUpdate('APPROVED')}
            disabled={updating || post.status === 'APPROVED'}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            <CheckCircleIcon className="w-5 h-5" />
            Approve
          </button>

          <button
            onClick={() => handleStatusUpdate('SUGGEST_CHANGES')}
            disabled={updating || post.status === 'SUGGEST_CHANGES'}
            className="flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            <PencilSquareIcon className="w-5 h-5" />
            Suggest Changes
          </button>

          <button
            onClick={() => handleStatusUpdate('REJECTED')}
            disabled={updating || post.status === 'REJECTED'}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            <XCircleIcon className="w-5 h-5" />
            Reject
          </button>

          <a
            href={post.typefullyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Open in Typefully
          </a>
        </div>

        {/* Feedback */}
        {post.feedback && (
          <div className="mt-8 bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-300 mb-2">Feedback:</h3>
            <p className="text-gray-200 whitespace-pre-wrap">{post.feedback}</p>
          </div>
        )}

        {/* Powered by footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Shared via Social Media Dashboard</p>
        </div>
      </div>
    </div>
  )
}

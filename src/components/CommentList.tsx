'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { CheckIcon, TrashIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Comment {
  id: string
  postId: string
  userId: string
  userName: string
  userRole: string
  commentText: string
  selectedText: string
  startOffset: number
  endOffset: number
  resolved: boolean
  createdAt: string
  updatedAt: string
}

interface CommentListProps {
  comments: Comment[]
  onCommentUpdate: () => void
  currentUserId: string
}

export default function CommentList({ comments, onCommentUpdate, currentUserId }: CommentListProps) {
  const [loadingCommentId, setLoadingCommentId] = useState<string | null>(null)

  const handleToggleResolved = async (commentId: string) => {
    setLoadingCommentId(commentId)
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      if (!response.ok) {
        throw new Error('Failed to update comment')
      }

      toast.success('Comment updated')
      onCommentUpdate()
    } catch (error) {
      console.error('Error updating comment:', error)
      toast.error('Failed to update comment')
    } finally {
      setLoadingCommentId(null)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }

    setLoadingCommentId(commentId)
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete comment')
      }

      toast.success('Comment deleted')
      onCommentUpdate()
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment')
    } finally {
      setLoadingCommentId(null)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'CLIENT':
        return 'bg-blue-900/50 text-blue-300 border-blue-800'
      case 'AGENCY':
        return 'bg-purple-900/50 text-purple-300 border-purple-800'
      case 'ADMIN':
        return 'bg-red-900/50 text-red-300 border-red-800'
      default:
        return 'bg-gray-900/50 text-gray-300 border-gray-800'
    }
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-12">
        <ChatBubbleLeftIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-300 text-sm font-medium">No comments yet</p>
        <p className="text-gray-500 text-xs mt-2">
          Select text in the tweet to add a comment
        </p>
      </div>
    )
  }

  const unresolvedComments = comments.filter(c => !c.resolved)
  const resolvedComments = comments.filter(c => c.resolved)

  return (
    <div className="space-y-4">
      {/* Unresolved Comments */}
      {unresolvedComments.length > 0 && (
        <div>
          <h5 className="text-xs font-bold text-gray-300 mb-4 uppercase tracking-wider">
            Active ({unresolvedComments.length})
          </h5>
          <div className="space-y-4">
            {unresolvedComments.map(comment => (
              <div
                key={comment.id}
                className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-semibold text-white">
                        {comment.userName}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-md border ${getRoleBadgeColor(comment.userRole)}`}>
                        {comment.userRole}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md text-xs text-yellow-200 leading-relaxed">
                  "{comment.selectedText}"
                </div>

                <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                  {comment.commentText}
                </p>

                <div className="flex items-center space-x-2 pt-3 border-t border-gray-800">
                  <button
                    onClick={() => handleToggleResolved(comment.id)}
                    disabled={loadingCommentId === comment.id}
                    className="flex items-center space-x-1.5 text-xs font-medium text-green-400 hover:text-green-300 px-3 py-1.5 rounded-md hover:bg-green-500/10 border border-green-500/20 hover:border-green-500/30 transition-all disabled:opacity-50"
                  >
                    <CheckIcon className="w-3.5 h-3.5" />
                    <span>Resolve</span>
                  </button>

                  {comment.userId === currentUserId && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={loadingCommentId === comment.id}
                      className="flex items-center space-x-1.5 text-xs font-medium text-red-400 hover:text-red-300 px-3 py-1.5 rounded-md hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/30 transition-all disabled:opacity-50"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolved Comments */}
      {resolvedComments.length > 0 && (
        <div>
          <h5 className="text-xs font-bold text-gray-300 mb-4 uppercase tracking-wider">
            Resolved ({resolvedComments.length})
          </h5>
          <div className="space-y-4">
            {resolvedComments.map(comment => (
              <div
                key={comment.id}
                className="bg-gray-900/30 border border-gray-800 rounded-lg p-4 opacity-70 hover:opacity-100 transition-opacity"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-semibold text-white">
                        {comment.userName}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-md border ${getRoleBadgeColor(comment.userRole)}`}>
                        {comment.userRole}
                      </span>
                      <CheckIcon className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div className="mb-3 p-3 bg-green-500/10 border border-green-500/30 rounded-md text-xs text-green-200 leading-relaxed">
                  "{comment.selectedText}"
                </div>

                <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                  {comment.commentText}
                </p>

                <div className="flex items-center space-x-2 pt-3 border-t border-gray-800">
                  <button
                    onClick={() => handleToggleResolved(comment.id)}
                    disabled={loadingCommentId === comment.id}
                    className="flex items-center space-x-1.5 text-xs font-medium text-gray-400 hover:text-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-500/10 border border-gray-700 hover:border-gray-600 transition-all disabled:opacity-50"
                  >
                    <span>Unresolve</span>
                  </button>

                  {comment.userId === currentUserId && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={loadingCommentId === comment.id}
                      className="flex items-center space-x-1.5 text-xs font-medium text-red-400 hover:text-red-300 px-3 py-1.5 rounded-md hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/30 transition-all disabled:opacity-50"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

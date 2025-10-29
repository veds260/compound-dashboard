'use client'

import { useState, useRef, useEffect } from 'react'
import TweetMockup from './TweetMockup'
import { ChatBubbleLeftIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
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

interface CommentableTweetMockupProps {
  postId: string
  clientName: string
  twitterHandle?: string
  profilePicture?: string
  tweetText: string
  timestamp?: Date
  onCommentAdded?: () => void
  shareToken?: string
}

export default function CommentableTweetMockup({
  postId,
  clientName,
  twitterHandle,
  profilePicture,
  tweetText,
  timestamp,
  onCommentAdded,
  shareToken
}: CommentableTweetMockupProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [showCommentButton, setShowCommentButton] = useState(false)
  const [showCommentPopup, setShowCommentPopup] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [guestName, setGuestName] = useState('')
  const [selection, setSelection] = useState<{
    text: string
    startOffset: number
    endOffset: number
    x: number
    y: number
  } | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch comments on mount
  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    try {
      const url = shareToken
        ? `/api/share/${shareToken}/comments`
        : `/api/posts/${postId}/comments`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleTextSelection = () => {
    const selectedText = window.getSelection()?.toString().trim()

    if (selectedText && selectedText.length > 0 && contentRef.current) {
      const range = window.getSelection()?.getRangeAt(0)
      if (!range) return

      // Calculate position for button
      const rect = range.getBoundingClientRect()
      const containerRect = contentRef.current.getBoundingClientRect()

      // Get the text offsets relative to the tweet text
      const fullText = tweetText
      const startOffset = fullText.indexOf(selectedText)
      const endOffset = startOffset + selectedText.length

      if (startOffset !== -1) {
        setSelection({
          text: selectedText,
          startOffset,
          endOffset,
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top - 10
        })
        setShowCommentButton(true)
        setShowCommentPopup(false)
      }
    } else {
      setShowCommentButton(false)
      setShowCommentPopup(false)
    }
  }

  const handleOpenCommentPopup = () => {
    setShowCommentButton(false)
    setShowCommentPopup(true)
    // Focus textarea after popup opens
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 100)
  }

  const handleAddComment = async () => {
    if (!commentText.trim() || !selection) {
      toast.error('Please enter a comment')
      return
    }

    // If it's a share token and no guest name is provided, show error
    if (shareToken && !guestName.trim()) {
      toast.error('Please enter your name')
      return
    }

    try {
      const url = shareToken
        ? `/api/share/${shareToken}/comments`
        : `/api/posts/${postId}/comments`

      const requestBody: any = {
        commentText: commentText.trim(),
        selectedText: selection.text,
        startOffset: selection.startOffset,
        endOffset: selection.endOffset
      }

      // Add guest name if it's a share token
      if (shareToken && guestName.trim()) {
        requestBody.guestName = guestName.trim()
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error('Failed to add comment')
      }

      const newComment = await response.json()
      setComments([...comments, newComment])
      setCommentText('')
      setGuestName('')
      setShowCommentPopup(false)
      setSelection(null)
      toast.success('Comment added!')

      if (onCommentAdded) {
        onCommentAdded()
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    }
  }

  const handleCancelComment = () => {
    setShowCommentButton(false)
    setShowCommentPopup(false)
    setSelection(null)
    setCommentText('')
    setGuestName('')
    window.getSelection()?.removeAllRanges()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleAddComment()
    }
  }

  // Render tweet text with comment highlights
  const renderTweetWithHighlights = () => {
    if (comments.length === 0) {
      return tweetText
    }

    const segments: Array<{
      text: string
      commentIds: string[]
      startOffset: number
      endOffset: number
    }> = []

    let currentIndex = 0

    // Sort comments by startOffset
    const sortedComments = [...comments].sort((a, b) => a.startOffset - b.startOffset)

    sortedComments.forEach(comment => {
      // Add text before this comment
      if (currentIndex < comment.startOffset) {
        segments.push({
          text: tweetText.slice(currentIndex, comment.startOffset),
          commentIds: [],
          startOffset: currentIndex,
          endOffset: comment.startOffset
        })
      }

      // Add the commented text
      const existingSegment = segments.find(
        s => s.startOffset === comment.startOffset && s.endOffset === comment.endOffset
      )

      if (existingSegment) {
        existingSegment.commentIds.push(comment.id)
      } else {
        segments.push({
          text: tweetText.slice(comment.startOffset, comment.endOffset),
          commentIds: [comment.id],
          startOffset: comment.startOffset,
          endOffset: comment.endOffset
        })
      }

      currentIndex = Math.max(currentIndex, comment.endOffset)
    })

    // Add remaining text
    if (currentIndex < tweetText.length) {
      segments.push({
        text: tweetText.slice(currentIndex),
        commentIds: [],
        startOffset: currentIndex,
        endOffset: tweetText.length
      })
    }

    return segments.map((segment, index) => {
      if (segment.commentIds.length > 0) {
        const unresolvedCount = segment.commentIds.filter(
          id => !comments.find(c => c.id === id)?.resolved
        ).length

        return (
          <span
            key={index}
            className={`relative ${
              unresolvedCount > 0
                ? 'bg-yellow-500/20 border-b-2 border-yellow-500 cursor-pointer'
                : 'bg-green-500/10 border-b-2 border-green-500/50'
            }`}
            title={`${unresolvedCount} unresolved comment(s)`}
          >
            {segment.text}
            {unresolvedCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {unresolvedCount}
              </span>
            )}
          </span>
        )
      }
      return <span key={index}>{segment.text}</span>
    })
  }

  return (
    <div className="relative">
      <div
        ref={contentRef}
        onMouseUp={handleTextSelection}
        className="relative select-text"
      >
        {/* Full TweetMockup with highlighted text */}
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
                    {clientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                )}
              </div>

              {/* Name and Handle */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1">
                  <span className="text-white font-bold hover:underline cursor-pointer text-[15px]">
                    {clientName}
                  </span>
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"
                    />
                  </svg>
                </div>
                <span className="text-gray-500 text-[15px]">
                  {twitterHandle?.startsWith('@') ? twitterHandle : twitterHandle ? `@${twitterHandle}` : '@user'}
                </span>
              </div>
            </div>

            {/* More Options */}
            <button className="text-gray-500 hover:text-blue-400 p-2 hover:bg-blue-500/10 rounded-full transition-colors flex-shrink-0">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
          </div>

          {/* Tweet Content with highlights */}
          <div className="text-white text-[15px] leading-[1.4] whitespace-pre-wrap break-words mb-4">
            {renderTweetWithHighlights()}
          </div>

          {/* Timestamp */}
          <div className="text-gray-500 text-[15px] mb-4 pb-4 border-b border-gray-800">
            {timestamp ? new Date(timestamp).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, month: 'short', day: 'numeric', year: 'numeric' })} · <span className="text-white font-semibold">X</span> for iPhone
          </div>

          {/* Help text */}
          <div className="text-xs text-gray-400 text-center py-2 border-t border-gray-800">
            💡 Select any text above to add a comment
          </div>
        </div>
      </div>

      {/* Comment Button - Shows first after text selection */}
      {showCommentButton && selection && (
        <button
          onClick={handleOpenCommentPopup}
          className="absolute z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg transition-all hover:scale-110"
          style={{
            left: `${selection.x}px`,
            top: `${selection.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <ChatBubbleLeftIcon className="w-5 h-5" />
        </button>
      )}

      {/* Comment Popup - Shows after clicking the button */}
      {showCommentPopup && selection && (
        <div
          className="absolute z-50 bg-theme-card border border-theme-border rounded-lg shadow-xl p-4 w-80"
          style={{
            left: `${selection.x}px`,
            top: `${selection.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <ChatBubbleLeftIcon className="w-5 h-5 text-blue-400" />
              <h4 className="text-sm font-medium text-white">Add Comment</h4>
            </div>
            <button
              onClick={handleCancelComment}
              className="text-gray-400 hover:text-white"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-300">
            "{selection.text}"
          </div>

          {/* Guest Name Input - Only show for share links */}
          {shareToken && (
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-md border border-theme-border bg-theme-bg text-gray-200 placeholder-gray-500 p-2 text-sm mb-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          )}

          <textarea
            ref={textareaRef}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add your comment... (Ctrl+Enter to submit)"
            className="w-full rounded-md border border-theme-border bg-theme-bg text-gray-200 placeholder-gray-500 p-2 text-sm mb-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            rows={3}
          />

          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={handleCancelComment}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white rounded-md hover:bg-theme-bg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddComment}
              disabled={!commentText.trim() || (shareToken ? !guestName.trim() : false)}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Comment
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

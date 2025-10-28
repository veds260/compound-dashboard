'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { CloudArrowUpIcon, DocumentArrowUpIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface DualCSVUploadProps {
  clientId: string
  onUploadSuccess: () => void
}

export default function DualCSVUpload({ clientId, onUploadSuccess }: DualCSVUploadProps) {
  const [isUploadingTweets, setIsUploadingTweets] = useState(false)
  const [isUploadingFollowers, setIsUploadingFollowers] = useState(false)
  const [tweetsUploaded, setTweetsUploaded] = useState(false)
  const [followersUploaded, setFollowersUploaded] = useState(false)

  const uploadFile = async (file: File, type: 'tweets' | 'followers') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('clientId', clientId)
    formData.append('type', type)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Upload failed')
    }

    return result
  }

  const onDropTweets = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]

    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }

    setIsUploadingTweets(true)

    try {
      const result = await uploadFile(file, 'tweets')
      toast.success(result.message || 'Tweets CSV uploaded successfully!')
      setTweetsUploaded(true)

      if (followersUploaded) {
        onUploadSuccess()
      }
    } catch (error) {
      console.error('Tweets upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Tweets upload failed')
    } finally {
      setIsUploadingTweets(false)
    }
  }

  const onDropFollowers = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]

    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }

    setIsUploadingFollowers(true)

    try {
      const result = await uploadFile(file, 'followers')
      toast.success(result.message || 'Followers CSV uploaded successfully!')
      setFollowersUploaded(true)

      if (tweetsUploaded) {
        onUploadSuccess()
      }
    } catch (error) {
      console.error('Followers upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Followers upload failed')
    } finally {
      setIsUploadingFollowers(false)
    }
  }

  const tweetsDrop = useDropzone({
    onDrop: onDropTweets,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    multiple: false,
    disabled: isUploadingTweets
  })

  const followersDrop = useDropzone({
    onDrop: onDropFollowers,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    multiple: false,
    disabled: isUploadingFollowers
  })

  return (
    <div className="w-full space-y-6">
      {/* Warning Alert */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-r-lg">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Important: Keep Data Aligned
            </h3>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              Upload both CSVs from the same time period for accurate analytics. Misaligned data will result in incorrect follower growth metrics.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tweets CSV Upload */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold mr-2">
              1
            </span>
            Tweets Analytics CSV
            {tweetsUploaded && (
              <CheckCircleIcon className="h-5 w-5 text-green-500 ml-2" />
            )}
          </h3>
          <div
            {...tweetsDrop.getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${tweetsDrop.isDragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : tweetsUploaded
                ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }
              ${isUploadingTweets ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...tweetsDrop.getInputProps()} />

            <div className="flex flex-col items-center">
              {isUploadingTweets ? (
                <CloudArrowUpIcon className="h-10 w-10 text-blue-500 animate-pulse mb-3" />
              ) : tweetsUploaded ? (
                <CheckCircleIcon className="h-10 w-10 text-green-500 mb-3" />
              ) : (
                <DocumentArrowUpIcon className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-3" />
              )}

              <div className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                {isUploadingTweets ? 'Processing...' : tweetsUploaded ? 'Uploaded!' : 'Upload Tweets CSV'}
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400">
                {tweetsDrop.isDragActive
                  ? 'Drop the CSV file here'
                  : 'Drag & drop or click to select'
                }
              </div>

              <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Format: tweet_id, created_at, text, url...
              </div>
            </div>
          </div>
        </div>

        {/* Followers CSV Upload */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold mr-2">
              2
            </span>
            Followers Analytics CSV
            {followersUploaded && (
              <CheckCircleIcon className="h-5 w-5 text-green-500 ml-2" />
            )}
          </h3>
          <div
            {...followersDrop.getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${followersDrop.isDragActive
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : followersUploaded
                ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
              }
              ${isUploadingFollowers ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...followersDrop.getInputProps()} />

            <div className="flex flex-col items-center">
              {isUploadingFollowers ? (
                <CloudArrowUpIcon className="h-10 w-10 text-purple-500 animate-pulse mb-3" />
              ) : followersUploaded ? (
                <CheckCircleIcon className="h-10 w-10 text-green-500 mb-3" />
              ) : (
                <DocumentArrowUpIcon className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-3" />
              )}

              <div className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                {isUploadingFollowers ? 'Processing...' : followersUploaded ? 'Uploaded!' : 'Upload Followers CSV'}
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400">
                {followersDrop.isDragActive
                  ? 'Drop the CSV file here'
                  : 'Drag & drop or click to select'
                }
              </div>

              <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Format: Date Range, Followers
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {tweetsUploaded && followersUploaded && (
        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 p-4 rounded-r-lg">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                Upload Complete!
              </h3>
              <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                Both CSVs have been processed successfully. Your analytics dashboard will now show complete data including follower growth.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

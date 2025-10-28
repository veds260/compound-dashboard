'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { CloudArrowUpIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface CSVUploadProps {
  clientId: string
  onUploadSuccess: () => void
}

export default function CSVUpload({ clientId, onUploadSuccess }: CSVUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }

    setIsUploading(true)
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('clientId', clientId)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      toast.success(result.message)
      onUploadSuccess()
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    multiple: false,
    disabled: isUploading
  })

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-primary-400'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center">
          {isUploading ? (
            <CloudArrowUpIcon className="h-12 w-12 text-primary-500 animate-pulse mb-4" />
          ) : (
            <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 mb-4" />
          )}
          
          <div className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {isUploading ? 'Processing...' : 'Upload Twitter Analytics CSV'}
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-4">
            {isDragActive 
              ? 'Drop the CSV file here'
              : 'Drag and drop your Twitter analytics CSV file here, or click to select'
            }
          </div>
          
          <div className="text-xs text-gray-400 dark:text-gray-500">
            Expected format: Date, Impressions, Engagements, etc.
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
        <p className="font-medium mb-1">CSV Requirements:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>File must be in CSV format (.csv)</li>
          <li>Should contain columns: date, impressions, engagements, retweets, etc.</li>
          <li>Download from Twitter Analytics dashboard</li>
          <li>First row should contain column headers</li>
        </ul>
      </div>
    </div>
  )
}
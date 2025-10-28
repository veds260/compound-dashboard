'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { CloudArrowUpIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface PostsImportProps {
  clientId: string
  onImportSuccess: () => void
}

export default function PostsImport({ clientId, onImportSuccess }: PostsImportProps) {
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
      const response = await fetch('/api/posts/import', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Import failed')
      }

      toast.success(result.message)
      onImportSuccess()
    } catch (error) {
      console.error('Import error:', error)
      toast.error(error instanceof Error ? error.message : 'Import failed')
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
            {isUploading ? 'Importing Posts...' : 'Import Posts from Google Sheet'}
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-4">
            {isDragActive 
              ? 'Drop the CSV file here'
              : 'Drag and drop your Google Sheet export (CSV), or click to select'
            }
          </div>
          
          <div className="text-xs text-gray-400 dark:text-gray-500">
            Expected format: Date, Topic Outline, Typefully Draft Link, etc.
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
        <p className="font-medium mb-1">CSV Import Instructions:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Export your Google Sheet as CSV format</li>
          <li>Should contain columns: Date, Topic Outline, Typefully Draft Link</li>
          <li>Posts with Typefully links will be imported for client approval</li>
          <li>Existing approval status and scheduling will be preserved</li>
          <li>Client can then approve/reject imported posts</li>
        </ul>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Expected Google Sheet Columns:</h4>
        <div className="text-xs text-blue-700 grid grid-cols-2 gap-2">
          <div>• Date</div>
          <div>• Topic Outline</div>
          <div>• Format</div>
          <div>• Typefully Draft Link</div>
          <div>• Time (GMT +8)</div>
          <div>• Typefully Scheduling</div>
          <div>• Approval</div>
          <div>• Status</div>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          The system will automatically map these columns and create posts for client approval.
        </p>
      </div>
    </div>
  )
}
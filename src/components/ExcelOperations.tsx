'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  DocumentArrowDownIcon, 
  DocumentArrowUpIcon,
  CloudArrowUpIcon 
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface ExcelOperationsProps {
  userRole: 'AGENCY' | 'CLIENT'
  clientId?: string
}

export default function ExcelOperations({ userRole, clientId }: ExcelOperationsProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (type: 'all' | 'client') => {
    setIsExporting(true)
    
    try {
      const url = type === 'all' ? '/api/excel/export' : `/api/excel/client/${clientId}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Export failed')
      }

      // Create blob and download
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      
      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `report-${new Date().toISOString().split('T')[0]}.xlsx`
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)

      toast.success('Report exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error(error instanceof Error ? error.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    
    if (!file) return

    // Check file type
    const validTypes = ['.xlsx', '.xls']
    const isValidType = validTypes.some(type => file.name.toLowerCase().endsWith(type))
    
    if (!isValidType) {
      toast.error('Please upload an Excel file (.xlsx or .xls)')
      return
    }

    setIsUploading(true)
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/excel/import', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      toast.success(result.message)
      
      // Show errors if any
      if (result.errors.length > 0) {
        console.warn('Import errors:', result.errors)
        toast.error(`${result.errors.length} rows had errors. Check console for details.`)
      }

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
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    disabled: isUploading || userRole === 'CLIENT'
  })

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100 dark:text-gray-100">Excel Integration</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400">
          Export data to Excel or import approval updates
        </p>
      </div>
      
      <div className="px-6 py-5 space-y-6">
        {/* Export Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Export Data</h4>
          <div className="flex flex-wrap gap-3">
            {userRole === 'AGENCY' && (
              <button
                onClick={() => handleExport('all')}
                disabled={isExporting}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                {isExporting ? 'Exporting...' : 'Export All Posts'}
              </button>
            )}
            
            {clientId && (
              <button
                onClick={() => handleExport('client')}
                disabled={isExporting}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                {isExporting ? 'Exporting...' : 'Export Client Report'}
              </button>
            )}
          </div>
        </div>

        {/* Import Section - Only for Agency */}
        {userRole === 'AGENCY' && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Import Updates</h4>
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${isDragActive 
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
                }
                ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input {...getInputProps()} />
              
              <div className="flex flex-col items-center">
                {isUploading ? (
                  <CloudArrowUpIcon className="h-8 w-8 text-primary-500 animate-pulse mb-2" />
                ) : (
                  <DocumentArrowUpIcon className="h-8 w-8 text-gray-400 mb-2" />
                )}
                
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {isUploading ? 'Processing...' : 'Upload Excel with Updates'}
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {isDragActive 
                    ? 'Drop the Excel file here'
                    : 'Drag and drop an Excel file here, or click to select'
                  }
                </div>
              </div>
            </div>
            
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              <p className="font-medium mb-1">Instructions:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Export posts first to get the correct format</li>
                <li>Update the 'Status' column (PENDING, APPROVED, REJECTED, etc.)</li>
                <li>Add feedback in the 'Feedback' column if needed</li>
                <li>Save and upload the modified Excel file</li>
              </ul>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Excel Integration Features
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                <ul className="list-disc list-inside space-y-1">
                  <li>Export posts and analytics data to Excel format</li>
                  <li>Update post statuses and feedback in Excel</li>
                  <li>Import updated data back to sync with clients</li>
                  <li>Generate client-specific reports</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
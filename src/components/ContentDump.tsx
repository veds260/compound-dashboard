'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { PlusIcon, TrashIcon, PencilIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface ContentDumpItem {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  client: {
    id: string
    name: string
    email: string
  }
}

interface ContentDumpProps {
  clientId: string
  userRole: 'AGENCY' | 'CLIENT'
}

export default function ContentDump({ clientId, userRole }: ContentDumpProps) {
  const [dumps, setDumps] = useState<ContentDumpItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDump, setEditingDump] = useState<ContentDumpItem | null>(null)
  const [newContent, setNewContent] = useState('')

  useEffect(() => {
    if (clientId) {
      fetchContentDumps()

      // Auto-refresh every 10 seconds
      const interval = setInterval(() => {
        fetchContentDumps()
      }, 10000)

      return () => clearInterval(interval)
    } else {
      setLoading(false)
    }
  }, [clientId])

  const fetchContentDumps = async () => {
    try {
      const response = await fetch(`/api/content-dumps?clientId=${clientId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load content dumps')
      }

      setDumps(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching content dumps:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load content dumps')
      setDumps([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newContent.trim()) {
      toast.error('Please enter some content')
      return
    }

    try {
      const response = await fetch('/api/content-dumps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newContent,
          clientId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create content dump')
      }

      const createdDump = await response.json()
      setDumps([createdDump, ...dumps])
      setIsModalOpen(false)
      setNewContent('')
      toast.success('Content dump created')
    } catch (error) {
      console.error('Error creating content dump:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create content dump')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingDump || !newContent.trim()) {
      toast.error('Please enter some content')
      return
    }

    try {
      const response = await fetch(`/api/content-dumps/${editingDump.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newContent })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update content dump')
      }

      const updatedDump = await response.json()
      setDumps(dumps.map(d => d.id === updatedDump.id ? updatedDump : d))
      setIsModalOpen(false)
      setEditingDump(null)
      setNewContent('')
      toast.success('Content dump updated')
    } catch (error) {
      console.error('Error updating content dump:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update content dump')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content dump?')) {
      return
    }

    try {
      const response = await fetch(`/api/content-dumps/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete content dump')
      }

      setDumps(dumps.filter(d => d.id !== id))
      toast.success('Content dump deleted')
    } catch (error) {
      console.error('Error deleting content dump:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete content dump')
    }
  }

  const openCreateModal = () => {
    setEditingDump(null)
    setNewContent('')
    setIsModalOpen(true)
  }

  const openEditModal = (dump: ContentDumpItem) => {
    setEditingDump(dump)
    setNewContent(dump.content)
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!clientId) {
    return (
      <div className="bg-theme-card backdrop-blur-sm shadow-soft rounded-xl border border-theme-border p-12">
        <div className="text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-white">Select a client</h3>
          <p className="mt-1 text-sm text-gray-400">
            Please select a client from the dropdown above to view their content dumps.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-white">Content Dump</h2>
          <p className="text-sm text-gray-400 mt-1">
            Drop your thoughts, ideas, and links here for content inspiration
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2 transition-all duration-200 opacity-90 hover:opacity-100"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Content</span>
        </button>
      </div>

      <div className="grid gap-4">
        {dumps.map((dump) => (
          <div key={dump.id} className="bg-theme-card backdrop-blur-sm shadow-soft rounded-xl border border-theme-border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-gray-400">
                    {format(new Date(dump.createdAt), 'MMM d, yyyy')}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-400">
                    {format(new Date(dump.createdAt), 'h:mm a')}
                  </span>
                  {dump.createdAt !== dump.updatedAt && (
                    <>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">
                        edited
                      </span>
                    </>
                  )}
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                    {dump.content}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 flex-shrink-0">
                <button
                  onClick={() => openEditModal(dump)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors opacity-90 hover:opacity-100"
                  title="Edit"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(dump.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-90 hover:opacity-100"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {dumps.length === 0 && (
          <div className="bg-theme-card backdrop-blur-sm shadow-soft rounded-xl border border-theme-border p-12">
            <div className="text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-white">No content dumps yet</h3>
              <p className="mt-1 text-sm text-gray-400">
                Start by adding your first content dump with ideas, thoughts, or links.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => {
            setIsModalOpen(false)
            setEditingDump(null)
            setNewContent('')
          }}
        >
          <div
            className="bg-theme-card/95 backdrop-blur-sm rounded-xl p-6 w-full max-w-2xl shadow-large border border-theme-border"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-white mb-4">
              {editingDump ? 'Edit Content Dump' : 'New Content Dump'}
            </h3>

            <form onSubmit={editingDump ? handleUpdate : handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Content
                </label>
                <textarea
                  required
                  rows={10}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full rounded-md border-theme-border bg-theme-bg text-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-3"
                  placeholder="Drop your thoughts, ideas, inspiration, links, etc..."
                />
                <p className="mt-1 text-xs text-gray-400">
                  You can include links, bullet points, or any text that might inspire content creation.
                </p>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    setEditingDump(null)
                    setNewContent('')
                  }}
                  className="px-4 py-2 border border-theme-border rounded-md text-gray-400 bg-theme-card hover:text-gray-300 opacity-90 hover:opacity-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 opacity-90 hover:opacity-100"
                >
                  {editingDump ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

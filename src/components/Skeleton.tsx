'use client'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-700/50 rounded ${className}`} />
  )
}

export function PostCardSkeleton() {
  return (
    <div className="bg-theme-card rounded-lg p-4 border border-theme-border">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-3" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function PostCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="bg-theme-card border border-theme-border rounded-xl p-8">
      <div className="space-y-4">
        <Skeleton className="h-14 w-14 rounded-xl" />
        <div>
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="mt-6">
        <Skeleton className="h-12 w-16" />
      </div>
    </div>
  )
}

export function StatCardsSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-theme-border">
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-full max-w-xs" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-6 w-20 rounded-full" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-8 w-20" />
      </td>
    </tr>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden">
      <table className="min-w-full">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PostListItemSkeleton() {
  return (
    <div className="p-6 border-b border-theme-border">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="mb-4">
            <div className="p-4 bg-theme-bg rounded-lg border border-theme-border">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-3" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-4 w-4" />
              </div>
            </div>
          </div>
          <Skeleton className="h-4 w-48 mb-3" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex flex-col space-y-2 ml-4 min-w-[140px]">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function PostListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="bg-theme-card backdrop-blur-sm shadow-soft rounded-xl border border-theme-border overflow-hidden">
      <div className="divide-y divide-theme-border">
        {Array.from({ length: count }).map((_, i) => (
          <PostListItemSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

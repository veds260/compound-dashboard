import { PostListSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-theme-bg">
      <div className="flex">
        {/* Sidebar placeholder */}
        <div className="hidden md:block w-16 bg-theme-card/90 border-r border-theme-border" />

        {/* Main content */}
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <div className="h-8 w-48 bg-gray-700/50 rounded animate-pulse mb-2" />
              <div className="h-4 w-72 bg-gray-700/50 rounded animate-pulse" />
            </div>

            {/* Filter tabs placeholder */}
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-9 w-24 bg-gray-700/50 rounded-lg animate-pulse" />
              ))}
            </div>

            {/* Posts list skeleton */}
            <div className="bg-theme-card border border-theme-border rounded-xl p-6">
              <PostListSkeleton count={8} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

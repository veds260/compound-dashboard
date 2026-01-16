import { StatCardsSkeletonGrid, PostCardSkeletonGrid } from '@/components/Skeleton'

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

            {/* Stats Grid */}
            <StatCardsSkeletonGrid />

            {/* Content Review Section */}
            <div className="bg-theme-card border border-theme-border rounded-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-theme-border">
                <div className="h-6 w-36 bg-gray-700/50 rounded animate-pulse mb-2" />
                <div className="h-4 w-56 bg-gray-700/50 rounded animate-pulse" />
              </div>

              {/* Filter tabs placeholder */}
              <div className="px-6 pt-4 pb-2">
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-9 w-24 bg-gray-700/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>

              {/* Post cards */}
              <div className="px-6 py-5">
                <PostCardSkeletonGrid count={6} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

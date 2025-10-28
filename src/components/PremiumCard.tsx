import { ReactNode } from 'react'

interface PremiumCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  gradient?: boolean
  onClick?: () => void
}

export default function PremiumCard({ children, className = '', hover = false, gradient = false, onClick }: PremiumCardProps) {
  const baseClasses = "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-soft dark:shadow-gray-900/20"
  const hoverClasses = hover ? "hover:shadow-medium hover:scale-[1.02] transition-all duration-200 cursor-pointer" : ""
  const gradientClasses = gradient ? "bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-gray-800/90 dark:to-gray-900/90" : ""
  
  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${gradientClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { format, subDays, startOfDay } from 'date-fns'
import { 
  CalendarDaysIcon, 
  ArrowTrendingUpIcon, 
  UserGroupIcon, 
  EyeIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
  ChartPieIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'

interface AnalyticsData {
  date: string
  impressions: number
  engagements: number
  engagementRate: number
  retweets: number
  replies: number
  likes: number
  profileClicks: number
  urlClicks: number
  follows: number
  mediaViews: number
}

interface AnalyticsDashboardProps {
  clientId: string
  isAdminView?: boolean
}

interface MetricCardProps {
  title: string
  value: string | number
  change: string
  trend: 'up' | 'down' | 'neutral'
  icon: React.ElementType
}

function MetricCard({ title, value, change, trend, icon: Icon }: MetricCardProps) {
  const trendConfig = {
    up: { 
      color: 'text-green-600', 
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: '↗'
    },
    down: { 
      color: 'text-red-600', 
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: '↘'
    },
    neutral: { 
      color: 'text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 ', 
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      icon: '→'
    }
  }

  const config = trendConfig[trend]

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
            <div className={`w-12 h-12 ${config.bgColor} ${config.borderColor} border rounded-full flex items-center justify-center`}>
              <Icon className="h-6 w-6 text-gray-600 dark:text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">{value}</p>
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} ${config.bgColor}`}>
            <span className="mr-1 text-sm">{config.icon}</span>
            {change}
          </div>
        </div>
      </div>
    </div>
  )
}

type ChartType = 'line' | 'bar' | 'area'
type ViewMode = 'numbers' | 'percentages'

interface ComparisonData {
  current: {
    impressions: number
    engagements: number
    engagementRate: number
    follows: number
  }
  previous: {
    impressions: number
    engagements: number
    engagementRate: number
    follows: number
  }
  growth: {
    impressions: number
    engagements: number
    engagementRate: number
    follows: number
  }
}

export default function AnalyticsDashboard({ clientId, isAdminView = false }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7d')
  const [chartType, setChartType] = useState<ChartType>('line')
  const [viewMode, setViewMode] = useState<ViewMode>('numbers')
  const [showComparison, setShowComparison] = useState(false)
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null)

  useEffect(() => {
    fetchAnalytics()
    if (showComparison) {
      fetchComparisonData()
    }
  }, [clientId, dateRange, showComparison])

  const fetchAnalytics = async () => {
    try {
      const endpoint = isAdminView
        ? `/api/admin/analytics/${clientId}?range=${dateRange}`
        : `/api/analytics/${clientId}?range=${dateRange}`
      const response = await fetch(endpoint)
      const data = await response.json()
      setAnalytics(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setAnalytics([])
    } finally {
      setLoading(false)
    }
  }

  const fetchComparisonData = async () => {
    try {
      const endpoint = isAdminView
        ? `/api/admin/analytics/${clientId}/comparison?range=${dateRange}`
        : `/api/analytics/${clientId}/comparison?range=${dateRange}`
      const response = await fetch(endpoint)
      const data = await response.json()
      setComparisonData(data)
    } catch (error) {
      console.error('Error fetching comparison data:', error)
    }
  }

  const totalMetrics = analytics.reduce(
    (acc, day) => ({
      impressions: acc.impressions + day.impressions,
      engagements: acc.engagements + day.engagements,
      profileClicks: acc.profileClicks + day.profileClicks,
      follows: acc.follows + day.follows
    }),
    { impressions: 0, engagements: 0, profileClicks: 0, follows: 0 }
  )

  const avgEngagementRate = analytics.length > 0 
    ? analytics.reduce((acc, day) => acc + day.engagementRate, 0) / analytics.length * 100
    : 0

  const engagementDistribution = analytics.length > 0 ? [
    { name: 'Likes', value: analytics.reduce((acc, day) => acc + day.likes, 0), color: '#ef4444' },
    { name: 'Retweets', value: analytics.reduce((acc, day) => acc + day.retweets, 0), color: '#3b82f6' },
    { name: 'Replies', value: analytics.reduce((acc, day) => acc + day.replies, 0), color: '#10b981' }
  ] : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Helper functions
  const formatValue = (value: number, type: 'number' | 'percentage' = 'number') => {
    if (viewMode === 'percentages' && type === 'percentage') {
      return `${(value * 100).toFixed(1)}%`
    }
    return value.toLocaleString()
  }

  const renderChart = (data: any[], config: any) => {
    const ChartComponent = chartType === 'line' ? LineChart : chartType === 'bar' ? BarChart : AreaChart
    
    if (chartType === 'line') {
      return (
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis {...config.xAxis} tick={{ fontSize: 12, fill: '#6b7280' }} />
          <YAxis {...config.yAxis} tick={{ fontSize: 12, fill: '#6b7280' }} />
          <Tooltip {...config.tooltip} />
          {config.lines?.map((line: any, index: number) => (
            <Line key={index} {...line} strokeWidth={3} dot={{ r: 4 }} />
          ))}
        </ChartComponent>
      )
    } else if (chartType === 'bar') {
      return (
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis {...config.xAxis} tick={{ fontSize: 12, fill: '#6b7280' }} />
          <YAxis {...config.yAxis} tick={{ fontSize: 12, fill: '#6b7280' }} />
          <Tooltip {...config.tooltip} />
          {config.bars?.map((bar: any, index: number) => (
            <Bar key={index} {...bar} radius={[2, 2, 0, 0]} />
          ))}
        </ChartComponent>
      )
    } else {
      return (
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis {...config.xAxis} tick={{ fontSize: 12, fill: '#6b7280' }} />
          <YAxis {...config.yAxis} tick={{ fontSize: 12, fill: '#6b7280' }} />
          <Tooltip {...config.tooltip} />
          {config.areas?.map((area: any, index: number) => (
            <Area key={index} {...area} />
          ))}
        </ChartComponent>
      )
    }
  }

  return (
    <div className="space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen -m-6 p-6">
      {/* Header and Controls */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{isAdminView ? 'Client analytics overview and performance tracking' : 'Track your social media performance and growth'}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Date Range Selector */}
            <div className="flex items-center space-x-2">
              <CalendarDaysIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="rounded-lg border-gray-300 dark:border-gray-600 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex">
                <button
                  onClick={() => setViewMode('numbers')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    viewMode === 'numbers'
                      ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  Numbers
                </button>
                <button
                  onClick={() => setViewMode('percentages')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    viewMode === 'percentages'
                      ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  Percentages
                </button>
              </div>
            </div>

            {/* Comparison Toggle */}
            <div className="flex items-center space-x-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showComparison}
                  onChange={(e) => setShowComparison(e.target.checked)}
                  className="sr-only"
                />
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showComparison ? 'bg-blue-600' : 'bg-gray-200'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showComparison ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 ">
                  Period Comparison
                </span>
              </label>
            </div>

            {/* Chart Type Toggle */}
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setChartType('line')}
                className={`p-2 rounded-md transition-colors ${
                  chartType === 'line'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
                title="Line Chart"
              >
                <PresentationChartLineIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`p-2 rounded-md transition-colors ${
                  chartType === 'bar'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
                title="Bar Chart"
              >
                <ChartBarIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`p-2 rounded-md transition-colors ${
                  chartType === 'area'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
                title="Area Chart"
              >
                <ChartPieIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Impressions"
          value={totalMetrics.impressions.toLocaleString()}
          change={showComparison && comparisonData ?
            `${comparisonData.growth.impressions > 0 ? '+' : ''}${comparisonData.growth.impressions.toFixed(1)}% from last period` :
            "Enable comparison to see change"
          }
          trend={showComparison && comparisonData ?
            (comparisonData.growth.impressions > 0 ? 'up' : comparisonData.growth.impressions < 0 ? 'down' : 'neutral') :
            'neutral'
          }
          icon={EyeIcon}
        />
        <MetricCard
          title="Total Engagements"
          value={totalMetrics.engagements.toLocaleString()}
          change={showComparison && comparisonData ?
            `${comparisonData.growth.engagements > 0 ? '+' : ''}${comparisonData.growth.engagements.toFixed(1)}% from last period` :
            "Enable comparison to see change"
          }
          trend={showComparison && comparisonData ?
            (comparisonData.growth.engagements > 0 ? 'up' : comparisonData.growth.engagements < 0 ? 'down' : 'neutral') :
            'neutral'
          }
          icon={ArrowTrendingUpIcon}
        />
        <MetricCard
          title="Avg. Engagement Rate"
          value={viewMode === 'percentages' ? `${avgEngagementRate.toFixed(1)}%` : `${(avgEngagementRate/100).toFixed(3)}`}
          change={showComparison && comparisonData ?
            `${comparisonData.growth.engagementRate > 0 ? '+' : ''}${comparisonData.growth.engagementRate.toFixed(1)}% from last period` :
            "Enable comparison to see change"
          }
          trend={showComparison && comparisonData ?
            (comparisonData.growth.engagementRate > 0 ? 'up' : comparisonData.growth.engagementRate < 0 ? 'down' : 'neutral') :
            'neutral'
          }
          icon={CalendarDaysIcon}
        />
        <MetricCard
          title="New Follows"
          value={totalMetrics.follows.toLocaleString()}
          change={showComparison && comparisonData ?
            `${comparisonData.growth.follows > 0 ? '+' : ''}${comparisonData.growth.follows.toFixed(1)}% from last period` :
            "Enable comparison to see change"
          }
          trend={showComparison && comparisonData ?
            (comparisonData.growth.follows > 0 ? 'up' : comparisonData.growth.follows < 0 ? 'down' : 'neutral') :
            'neutral'
          }
          icon={UserGroupIcon}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Impressions & Engagements Trend */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Impressions vs Engagements</h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Impressions</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Engagements</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            {renderChart(analytics, {
              xAxis: {
                dataKey: "date",
                tickFormatter: (value: string) => format(new Date(value), 'MMM d')
              },
              yAxis: {},
              tooltip: {
                labelFormatter: (value: string) => format(new Date(value), 'MMM d, yyyy'),
                formatter: (value: number, name: string) => [value.toLocaleString(), name],
                contentStyle: {
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }
              },
              lines: [
                {
                  type: "monotone",
                  dataKey: "impressions",
                  stroke: "#3b82f6",
                  name: "Impressions"
                },
                {
                  type: "monotone",
                  dataKey: "engagements", 
                  stroke: "#ef4444",
                  name: "Engagements"
                }
              ],
              bars: [
                {
                  dataKey: "impressions",
                  fill: "#3b82f6",
                  name: "Impressions"
                },
                {
                  dataKey: "engagements",
                  fill: "#ef4444", 
                  name: "Engagements"
                }
              ],
              areas: [
                {
                  type: "monotone",
                  dataKey: "impressions",
                  stackId: "1",
                  stroke: "#3b82f6",
                  fill: "#3b82f6",
                  fillOpacity: 0.4
                },
                {
                  type: "monotone",
                  dataKey: "engagements",
                  stackId: "2", 
                  stroke: "#ef4444",
                  fill: "#ef4444",
                  fillOpacity: 0.4
                }
              ]
            })}
          </ResponsiveContainer>
        </div>

        {/* Engagement Rate Trend */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Engagement Rate</h3>
            <div className="flex items-center text-sm">
              <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Rate</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            {renderChart(analytics, {
              xAxis: {
                dataKey: "date",
                tickFormatter: (value: string) => format(new Date(value), 'MMM d')
              },
              yAxis: {
                tickFormatter: (value: number) => viewMode === 'percentages' ? `${(value * 100).toFixed(1)}%` : value.toFixed(3)
              },
              tooltip: {
                labelFormatter: (value: string) => format(new Date(value), 'MMM d, yyyy'),
                formatter: (value: number) => [
                  viewMode === 'percentages' ? `${(value * 100).toFixed(2)}%` : value.toFixed(4), 
                  'Engagement Rate'
                ],
                contentStyle: {
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }
              },
              lines: [
                {
                  type: "monotone",
                  dataKey: "engagementRate",
                  stroke: "#10b981",
                  name: "Engagement Rate"
                }
              ],
              bars: [
                {
                  dataKey: "engagementRate",
                  fill: "#10b981",
                  name: "Engagement Rate"
                }
              ],
              areas: [
                {
                  type: "monotone",
                  dataKey: "engagementRate",
                  stroke: "#10b981",
                  fill: "#10b981",
                  fillOpacity: 0.3
                }
              ]
            })}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Types Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Engagement Distribution</h3>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Likes</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Retweets</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Replies</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={engagementDistribution}
                cx="50%"
                cy="50%"
                outerRadius={110}
                innerRadius={40}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                style={{ fontSize: '12px', fontWeight: '500' }}
              >
                {engagementDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [value.toLocaleString(), '']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Activity */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Daily Activity Breakdown</h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Likes</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Retweets</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Replies</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={analytics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => format(new Date(value), 'MMM d')}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip
                labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="likes" stackId="a" fill="#ef4444" name="Likes" radius={[0, 0, 0, 0]} />
              <Bar dataKey="retweets" stackId="a" fill="#3b82f6" name="Retweets" radius={[0, 0, 0, 0]} />
              <Bar dataKey="replies" stackId="a" fill="#10b981" name="Replies" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparison Chart - Show when comparison is enabled */}
      {showComparison && comparisonData && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Period Comparison</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Current vs Previous {dateRange === '7d' ? '7 days' : dateRange === '30d' ? '30 days' : '90 days'}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current Period */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                Current Period
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Impressions</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {comparisonData.current.impressions.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Engagements</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {comparisonData.current.engagements.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Engagement Rate</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {comparisonData.current.engagementRate.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">New Follows</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {comparisonData.current.follows.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Previous Period */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                Previous Period
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Impressions</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {comparisonData.previous.impressions.toLocaleString()}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      comparisonData.growth.impressions > 0 ? 'bg-green-100 text-green-700' :
                      comparisonData.growth.impressions < 0 ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700 dark:text-gray-300'
                    }`}>
                      {comparisonData.growth.impressions > 0 ? '+' : ''}{comparisonData.growth.impressions.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Engagements</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {comparisonData.previous.engagements.toLocaleString()}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      comparisonData.growth.engagements > 0 ? 'bg-green-100 text-green-700' :
                      comparisonData.growth.engagements < 0 ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700 dark:text-gray-300'
                    }`}>
                      {comparisonData.growth.engagements > 0 ? '+' : ''}{comparisonData.growth.engagements.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Engagement Rate</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {comparisonData.previous.engagementRate.toFixed(2)}%
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      comparisonData.growth.engagementRate > 0 ? 'bg-green-100 text-green-700' :
                      comparisonData.growth.engagementRate < 0 ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700 dark:text-gray-300'
                    }`}>
                      {comparisonData.growth.engagementRate > 0 ? '+' : ''}{comparisonData.growth.engagementRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">New Follows</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {comparisonData.previous.follows.toLocaleString()}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      comparisonData.growth.follows > 0 ? 'bg-green-100 text-green-700' :
                      comparisonData.growth.follows < 0 ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700 dark:text-gray-300'
                    }`}>
                      {comparisonData.growth.follows > 0 ? '+' : ''}{comparisonData.growth.follows.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
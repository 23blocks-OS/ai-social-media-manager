'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi, postsApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TrendingUp,
  Users,
  MessageSquare,
  Share2,
  Eye,
  Heart,
  Twitter,
  Facebook,
  Linkedin,
  Instagram,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const platformIcons = {
  TWITTER: Twitter,
  FACEBOOK: Facebook,
  LINKEDIN: Linkedin,
  INSTAGRAM: Instagram,
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('7')
  const [platform, setPlatform] = useState('all')

  const { data: summary } = useQuery({
    queryKey: ['analytics-summary', dateRange, platform],
    queryFn: async () => {
      const params: any = {}
      if (platform !== 'all') params.platform = platform
      const res = await analyticsApi.getSummary(params)
      return res.data.data
    },
  })

  const { data: timeline } = useQuery({
    queryKey: ['analytics-timeline', dateRange, platform],
    queryFn: async () => {
      const params: any = {}
      if (platform !== 'all') params.platform = platform
      const res = await analyticsApi.getTimeline(params)
      return res.data.data
    },
  })

  const { data: topPosts } = useQuery({
    queryKey: ['top-posts', platform],
    queryFn: async () => {
      const params: any = { limit: 5, metric: 'engagement' }
      if (platform !== 'all') params.platform = platform
      const res = await analyticsApi.getTopPosts(params)
      return res.data.data
    },
  })

  const stats = [
    {
      name: 'Total Reach',
      value: summary?.totalViews?.toLocaleString() || '0',
      change: '+12.5%',
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Engagement',
      value: ((summary?.totalLikes || 0) + (summary?.totalComments || 0) + (summary?.totalShares || 0)).toLocaleString(),
      change: '+8.2%',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Likes',
      value: summary?.totalLikes?.toLocaleString() || '0',
      change: '+15.3%',
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      name: 'Comments',
      value: summary?.totalComments?.toLocaleString() || '0',
      change: '+23.1%',
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">
            Track your social media performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="TWITTER">Twitter</SelectItem>
              <SelectItem value="FACEBOOK">Facebook</SelectItem>
              <SelectItem value="INSTAGRAM">Instagram</SelectItem>
              <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <Badge variant="outline" className="flex items-center">
                  <ArrowUp className="mr-1 h-3 w-3" />
                  {stat.change}
                </Badge>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-sm text-gray-500">{stat.name}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Engagement Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeline || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="likes" stroke="#ef4444" name="Likes" />
              <Line type="monotone" dataKey="comments" stroke="#3b82f6" name="Comments" />
              <Line type="monotone" dataKey="shares" stroke="#10b981" name="Shares" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Platform Performance */}
        {summary?.byPlatform && Object.keys(summary.byPlatform).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(summary.byPlatform).map(([platform, data]: [string, any]) => ({
                  platform,
                  engagement: data.likes + data.comments + data.shares,
                  likes: data.likes,
                  comments: data.comments,
                  shares: data.shares,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platform" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="likes" fill="#ef4444" name="Likes" />
                  <Bar dataKey="comments" fill="#3b82f6" name="Comments" />
                  <Bar dataKey="shares" fill="#10b981" name="Shares" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Performing Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPosts?.map((post: any, index: number) => {
                const Icon = platformIcons[post.platform as keyof typeof platformIcons]
                const analytics = post.analytics?.[0]
                const engagement = (analytics?.likes || 0) + (analytics?.comments || 0) + (analytics?.shares || 0)

                return (
                  <div
                    key={post.id}
                    className="flex items-start space-x-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0 text-center">
                      <div className="text-2xl font-bold text-gray-300">#{index + 1}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Icon className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-500">@{post.socialAccount?.username}</span>
                      </div>
                      <p className="text-sm text-gray-900 line-clamp-2">{post.content}</p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Heart className="mr-1 h-3 w-3" />
                          {analytics?.likes || 0}
                        </span>
                        <span className="flex items-center">
                          <MessageSquare className="mr-1 h-3 w-3" />
                          {analytics?.comments || 0}
                        </span>
                        <span className="flex items-center">
                          <Share2 className="mr-1 h-3 w-3" />
                          {analytics?.shares || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm font-bold text-gray-900">{engagement}</div>
                      <div className="text-xs text-gray-500">total engagement</div>
                    </div>
                  </div>
                )
              })}
              {(!topPosts || topPosts.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2">No data available yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

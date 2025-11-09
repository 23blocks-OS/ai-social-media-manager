'use client'

import { useQuery } from '@tanstack/react-query'
import { analyticsApi, postsApi, socialAccountsApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  Users,
  MessageSquare,
  Calendar,
  Plus,
  Twitter,
  Facebook,
  Linkedin,
  Instagram,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: summary } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      const res = await analyticsApi.getSummary()
      return res.data.data
    },
  })

  const { data: recentPosts } = useQuery({
    queryKey: ['recent-posts'],
    queryFn: async () => {
      const res = await postsApi.getAll({ limit: 5 })
      return res.data.data
    },
  })

  const { data: accounts } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: async () => {
      const res = await socialAccountsApi.getAll()
      return res.data.data
    },
  })

  const stats = [
    {
      name: 'Total Reach',
      value: summary?.totalViews?.toLocaleString() || '0',
      change: '+12.5%',
      changeType: 'increase',
      icon: Users,
    },
    {
      name: 'Total Engagement',
      value: (summary?.totalLikes + summary?.totalComments + summary?.totalShares)?.toLocaleString() || '0',
      change: '+8.2%',
      changeType: 'increase',
      icon: TrendingUp,
    },
    {
      name: 'Comments',
      value: summary?.totalComments?.toLocaleString() || '0',
      change: '+15.3%',
      changeType: 'increase',
      icon: MessageSquare,
    },
    {
      name: 'Posts Published',
      value: summary?.totalPosts?.toString() || '0',
      change: '-2.4%',
      changeType: 'decrease',
      icon: Calendar,
    },
  ]

  const platformIcons = {
    TWITTER: Twitter,
    FACEBOOK: Facebook,
    LINKEDIN: Linkedin,
    INSTAGRAM: Instagram,
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back! Here's what's happening with your social media.
          </p>
        </div>
        <Link href="/dashboard/compose">
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Create Post
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <stat.icon className="h-8 w-8 text-gray-400" />
                <Badge
                  variant={stat.changeType === 'increase' ? 'default' : 'destructive'}
                  className="flex items-center"
                >
                  {stat.changeType === 'increase' ? (
                    <ArrowUp className="mr-1 h-3 w-3" />
                  ) : (
                    <ArrowDown className="mr-1 h-3 w-3" />
                  )}
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPosts?.slice(0, 5).map((post: any) => {
                const Icon = platformIcons[post.platform as keyof typeof platformIcons]
                return (
                  <div
                    key={post.id}
                    className="flex items-start space-x-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <Icon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 line-clamp-2">{post.content}</p>
                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                        <span>{post.socialAccount?.username}</span>
                        <span>•</span>
                        <Badge variant={post.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                          {post.status}
                        </Badge>
                      </div>
                    </div>
                    {post.analytics?.[0] && (
                      <div className="flex-shrink-0 text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {post.analytics[0].likes}
                        </div>
                        <div className="text-xs text-gray-500">likes</div>
                      </div>
                    )}
                  </div>
                )
              })}
              {(!recentPosts || recentPosts.length === 0) && (
                <div className="text-center py-6 text-gray-500">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2">No posts yet</p>
                  <Link href="/dashboard/compose">
                    <Button className="mt-4" variant="outline">
                      Create your first post
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Connected Accounts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Connected Accounts</CardTitle>
              <Link href="/dashboard/accounts">
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accounts?.map((account: any) => {
                const Icon = platformIcons[account.platform as keyof typeof platformIcons]
                return (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Icon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {account.displayName || account.username}
                        </p>
                        <p className="text-xs text-gray-500">@{account.username}</p>
                      </div>
                    </div>
                    <Badge variant={account.isActive ? 'default' : 'secondary'}>
                      {account.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                )
              })}
              {(!accounts || accounts.length === 0) && (
                <div className="text-center py-6 text-gray-500">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2">No accounts connected</p>
                  <Link href="/dashboard/accounts">
                    <Button className="mt-4" variant="outline">
                      Connect your first account
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Performance */}
      {summary?.byPlatform && Object.keys(summary.byPlatform).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Platform Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(summary.byPlatform).map(([platform, data]: [string, any]) => {
                const Icon = platformIcons[platform as keyof typeof platformIcons]
                const totalEngagement = data.likes + data.comments + data.shares
                const maxEngagement = Math.max(
                  ...Object.values(summary.byPlatform).map((p: any) => p.likes + p.comments + p.shares)
                )
                const percentage = (totalEngagement / maxEngagement) * 100

                return (
                  <div key={platform}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Icon className="h-5 w-5 text-gray-400" />
                        <span className="text-sm font-medium">{platform}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {totalEngagement.toLocaleString()} engagement
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

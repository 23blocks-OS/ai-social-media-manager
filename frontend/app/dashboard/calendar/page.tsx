'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { postsApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChevronLeft,
  ChevronRight,
  Twitter,
  Facebook,
  Linkedin,
  Instagram,
  Plus,
  Clock,
  Calendar as CalendarIcon,
} from 'lucide-react'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths } from 'date-fns'

const platformIcons = {
  TWITTER: Twitter,
  FACEBOOK: Facebook,
  LINKEDIN: Linkedin,
  INSTAGRAM: Instagram,
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [filterPlatform, setFilterPlatform] = useState('all')
  const [view, setView] = useState<'month' | 'week' | 'list'>('month')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const { data: posts } = useQuery({
    queryKey: ['calendar-posts', format(currentDate, 'yyyy-MM')],
    queryFn: async () => {
      const res = await postsApi.getAll({
        status: 'SCHEDULED',
        limit: 100,
      })
      return res.data.data
    },
  })

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get posts for a specific day
  const getPostsForDay = (day: Date) => {
    return posts?.filter((post: any) =>
      post.scheduledFor && isSameDay(parseISO(post.scheduledFor), day)
    ) || []
  }

  const selectedDayPosts = selectedDate ? getPostsForDay(selectedDate) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Calendar</h1>
          <p className="text-gray-500 mt-1">
            Plan and schedule your social media content
          </p>
        </div>
        <Link href="/dashboard/compose">
          <Button>
            <Plus className="mr-2 h-5 w-5" />
            Schedule Post
          </Button>
        </Link>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-xl font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="TWITTER">Twitter</SelectItem>
              <SelectItem value="FACEBOOK">Facebook</SelectItem>
              <SelectItem value="INSTAGRAM">Instagram</SelectItem>
              <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
            </SelectContent>
          </Select>

          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {daysInMonth.map(day => {
                const dayPosts = getPostsForDay(day)
                const isToday = isSameDay(day, new Date())
                const isSelected = selectedDate && isSameDay(day, selectedDate)

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      min-h-24 p-2 border rounded-lg text-left transition-all hover:border-blue-500
                      ${isToday ? 'bg-blue-50 border-blue-300' : ''}
                      ${isSelected ? 'ring-2 ring-blue-500' : ''}
                    `}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayPosts.slice(0, 2).map((post: any) => {
                        const Icon = platformIcons[post.platform as keyof typeof platformIcons]
                        return (
                          <div
                            key={post.id}
                            className="flex items-center space-x-1 text-xs bg-gray-100 rounded px-1 py-0.5"
                          >
                            <Icon className="h-3 w-3" />
                            <span className="truncate">
                              {format(parseISO(post.scheduledFor), 'h:mm a')}
                            </span>
                          </div>
                        )
                      })}
                      {dayPosts.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{dayPosts.length - 2} more
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate && selectedDayPosts.length > 0 ? (
              <div className="space-y-4">
                {selectedDayPosts.map((post: any) => {
                  const Icon = platformIcons[post.platform as keyof typeof platformIcons]
                  return (
                    <div
                      key={post.id}
                      className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">
                            {format(parseISO(post.scheduledFor), 'h:mm a')}
                          </span>
                        </div>
                        <Badge variant="outline">{post.platform}</Badge>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {post.content}
                      </p>
                      <div className="mt-2 flex items-center space-x-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Delete</Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : selectedDate ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2">No posts scheduled</p>
                <Link href="/dashboard/compose">
                  <Button className="mt-4" variant="outline" size="sm">
                    Schedule a post
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2">Select a date to view scheduled posts</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {posts?.slice(0, 10).map((post: any) => {
              const Icon = platformIcons[post.platform as keyof typeof platformIcons]
              return (
                <div
                  key={post.id}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-3 flex-1">
                    <Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {format(parseISO(post.scheduledFor), 'MMM d, h:mm a')}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                        {post.content}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{post.platform}</Badge>
                </div>
              )
            })}
            {(!posts || posts.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2">No upcoming posts</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

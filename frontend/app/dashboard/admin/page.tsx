'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Search,
  MoreVertical,
  Loader2,
  Crown,
  Rocket,
  Zap,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react'
import { subscriptionsApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const TIER_ICONS = {
  FREE: Zap,
  PRO: Rocket,
  BUSINESS: Crown,
}

const TIER_COLORS = {
  FREE: 'bg-gray-100 text-gray-800',
  PRO: 'bg-purple-100 text-purple-800',
  BUSINESS: 'bg-amber-100 text-amber-800',
}

const STATUS_CONFIG = {
  TRIAL: { label: 'Trial', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  PAST_DUE: { label: 'Past Due', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  CANCELED: { label: 'Canceled', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-800', icon: XCircle },
}

export default function AdminDashboardPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const response = await subscriptionsApi.admin.getAnalytics()
      return response.data
    },
  })

  const { data: subscriptionsData, isLoading: loadingSubscriptions } = useQuery({
    queryKey: ['admin-subscriptions', currentPage],
    queryFn: async () => {
      const response = await subscriptionsApi.admin.getAllSubscriptions(currentPage, 20)
      return response.data
    },
  })

  const filteredSubscriptions = subscriptionsData?.subscriptions?.filter(
    (sub: any) =>
      sub.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loadingAnalytics) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage users, subscriptions, and view analytics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Subscriptions
            </CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.totalSubscriptions || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Subscriptions
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.activeSubscriptions || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Trial Users
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.trialSubscriptions || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics?.totalRevenue || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution */}
      {analytics?.planDistribution && (
        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {analytics.planDistribution.map((plan: any) => (
                <div
                  key={plan.planId}
                  className="p-4 border rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-purple-100 mr-3">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Plan ID</p>
                      <p className="font-semibold">{plan.planId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{plan._count}</p>
                    <p className="text-sm text-gray-600">users</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Subscriptions</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingSubscriptions ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        User
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Plan
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Current Period
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Created
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscriptions?.map((subscription: any) => {
                      const statusConfig =
                        STATUS_CONFIG[
                          subscription.status as keyof typeof STATUS_CONFIG
                        ]
                      const StatusIcon = statusConfig?.icon || AlertCircle

                      return (
                        <tr key={subscription.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{subscription.user.name}</p>
                              <p className="text-sm text-gray-600">
                                {subscription.user.email}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={TIER_COLORS[subscription.plan.tier as keyof typeof TIER_COLORS]}>
                              {subscription.plan.name}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={statusConfig?.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig?.label}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm">
                              {new Date(
                                subscription.currentPeriodStart
                              ).toLocaleDateString()}{' '}
                              -{' '}
                              {new Date(
                                subscription.currentPeriodEnd
                              ).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm">
                              {new Date(subscription.createdAt).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {subscriptionsData?.pagination && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * 20 + 1} to{' '}
                    {Math.min(
                      currentPage * 20,
                      subscriptionsData.pagination.total
                    )}{' '}
                    of {subscriptionsData.pagination.total} subscriptions
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={
                        currentPage >= subscriptionsData.pagination.totalPages
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

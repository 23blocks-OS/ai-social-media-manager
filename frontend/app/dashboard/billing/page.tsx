'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  CreditCard,
  Calendar,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Loader2,
  Crown,
  Rocket,
  Zap,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { subscriptionsApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

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

export default function BillingPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const { data: subscription, isLoading: loadingSubscription } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      const response = await subscriptionsApi.getCurrent()
      return response.data.subscription
    },
  })

  const { data: usage, isLoading: loadingUsage } = useQuery({
    queryKey: ['subscription-usage'],
    queryFn: async () => {
      const response = await subscriptionsApi.getUsage()
      return response.data
    },
  })

  const billingPortalMutation = useMutation({
    mutationFn: async () => {
      const returnUrl = `${window.location.origin}/dashboard/billing`
      const response = await subscriptionsApi.createBillingPortal(returnUrl)
      return response.data
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url
      }
    },
    onError: (error: any) => {
      console.error('Billing portal error:', error)
      alert(error.response?.data?.message || 'Failed to open billing portal')
      setLoadingAction(null)
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!subscription?.id) throw new Error('No subscription found')
      const response = await subscriptionsApi.cancelSubscription(subscription.id)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] })
      setLoadingAction(null)
    },
    onError: (error: any) => {
      console.error('Cancel error:', error)
      alert(error.response?.data?.message || 'Failed to cancel subscription')
      setLoadingAction(null)
    },
  })

  const reactivateMutation = useMutation({
    mutationFn: async () => {
      if (!subscription?.id) throw new Error('No subscription found')
      const response = await subscriptionsApi.reactivateSubscription(subscription.id)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] })
      setLoadingAction(null)
    },
    onError: (error: any) => {
      console.error('Reactivate error:', error)
      alert(error.response?.data?.message || 'Failed to reactivate subscription')
      setLoadingAction(null)
    },
  })

  const handleManageBilling = () => {
    setLoadingAction('billing')
    billingPortalMutation.mutate()
  }

  const handleCancelSubscription = () => {
    if (confirm('Are you sure you want to cancel your subscription? You\'ll have access until the end of your billing period.')) {
      setLoadingAction('cancel')
      cancelMutation.mutate()
    }
  }

  const handleReactivate = () => {
    setLoadingAction('reactivate')
    reactivateMutation.mutate()
  }

  if (loadingSubscription || loadingUsage) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  const plan = usage?.plan
  const Icon = plan ? TIER_ICONS[plan.tier as keyof typeof TIER_ICONS] : CreditCard
  const statusConfig = subscription ? STATUS_CONFIG[subscription.status as keyof typeof STATUS_CONFIG] : null
  const StatusIcon = statusConfig?.icon || AlertCircle

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-gray-600 mt-2">
          Manage your subscription and view your usage
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Plan</span>
            {subscription && statusConfig && (
              <Badge className={statusConfig.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscription && plan ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div
                    className={`p-3 rounded-lg ${
                      plan.tier === 'FREE'
                        ? 'bg-gray-100'
                        : plan.tier === 'PRO'
                        ? 'bg-purple-100'
                        : 'bg-amber-100'
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 ${
                        plan.tier === 'FREE'
                          ? 'text-gray-600'
                          : plan.tier === 'PRO'
                          ? 'text-purple-600'
                          : 'text-amber-600'
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{plan.name} Plan</h3>
                    <p className="text-2xl font-bold mt-1">
                      ${(plan.price / 100).toFixed(2)}
                      <span className="text-sm font-normal text-gray-600">
                        /month
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      {plan.description}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {subscription.cancelAtPeriodEnd ? (
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-amber-600">
                        Cancels on{' '}
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReactivate}
                        disabled={loadingAction === 'reactivate'}
                      >
                        {loadingAction === 'reactivate' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Reactivate'
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Calendar className="h-4 w-4 mr-1" />
                      Renews{' '}
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => router.push('/pricing')}
                >
                  Change Plan
                </Button>
                {plan.tier !== 'FREE' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleManageBilling}
                      disabled={loadingAction === 'billing'}
                    >
                      {loadingAction === 'billing' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      )}
                      Manage Billing
                    </Button>
                    {!subscription.cancelAtPeriodEnd && (
                      <Button
                        variant="destructive"
                        onClick={handleCancelSubscription}
                        disabled={loadingAction === 'cancel'}
                      >
                        {loadingAction === 'cancel' ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Cancel Subscription
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No active subscription</p>
              <Button onClick={() => router.push('/pricing')}>
                Choose a Plan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Stats */}
      {usage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Usage This Month
            </CardTitle>
            <CardDescription>
              Resets on {new Date(usage.resetDate).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Posts Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Posts</span>
                  <span className="text-sm text-gray-600">
                    {usage.usage.posts.current} / {usage.usage.posts.limit === 999999 ? '∞' : usage.usage.posts.limit}
                  </span>
                </div>
                <Progress
                  value={Math.min(usage.usage.posts.percentage, 100)}
                  className="h-2"
                />
              </div>

              {/* Social Accounts Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Social Accounts</span>
                  <span className="text-sm text-gray-600">
                    {usage.usage.socialAccounts.current} /{' '}
                    {usage.usage.socialAccounts.limit === 999999 ? '∞' : usage.usage.socialAccounts.limit}
                  </span>
                </div>
                <Progress
                  value={Math.min(usage.usage.socialAccounts.percentage, 100)}
                  className="h-2"
                />
              </div>

              {/* AI Generations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">AI Generations</span>
                  <span className="text-sm text-gray-600">
                    {usage.usage.aiGenerations.current}
                  </span>
                </div>
              </div>

              {/* Usage Breakdown */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">Breakdown</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="text-xl font-bold">
                      {usage.usage.breakdown.postsCreated}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Scheduled</p>
                    <p className="text-xl font-bold">
                      {usage.usage.breakdown.postsScheduled}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Published</p>
                    <p className="text-xl font-bold">
                      {usage.usage.breakdown.postsPublished}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Features */}
      {plan && (
        <Card>
          <CardHeader>
            <CardTitle>Plan Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {plan.features.advancedAI && (
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm">Advanced AI Features</span>
                </div>
              )}
              {plan.features.analytics && (
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm">Advanced Analytics</span>
                </div>
              )}
              {plan.features.autoReplies && (
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm">Auto-Replies</span>
                </div>
              )}
              {plan.features.customBranding && (
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm">Custom Branding</span>
                </div>
              )}
              {plan.features.apiAccess && (
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm">API Access</span>
                </div>
              )}
              {plan.features.prioritySupport && (
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm">Priority Support</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

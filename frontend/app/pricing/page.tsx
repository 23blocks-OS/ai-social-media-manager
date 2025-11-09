'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Check, Zap, Rocket, Crown, Loader2 } from 'lucide-react'
import { subscriptionsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const TIER_ICONS = {
  FREE: Zap,
  PRO: Rocket,
  BUSINESS: Crown,
}

const TIER_COLORS = {
  FREE: 'text-gray-600',
  PRO: 'text-purple-600',
  BUSINESS: 'text-amber-600',
}

export default function PricingPage() {
  const router = useRouter()
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)

  const { data: plansData, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const response = await subscriptionsApi.getPlans()
      return response.data
    },
  })

  const { data: currentSubscription } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      const response = await subscriptionsApi.getCurrent()
      return response.data.subscription
    },
  })

  const checkoutMutation = useMutation({
    mutationFn: async (planId: string) => {
      const successUrl = `${window.location.origin}/dashboard?subscription=success`
      const cancelUrl = `${window.location.origin}/pricing?subscription=canceled`

      const response = await subscriptionsApi.createCheckout(
        planId,
        successUrl,
        cancelUrl
      )
      return response.data
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    },
    onError: (error: any) => {
      console.error('Checkout error:', error)
      alert(error.response?.data?.message || 'Failed to start checkout')
      setLoadingPlanId(null)
    },
  })

  const handleSelectPlan = async (planId: string, tier: string) => {
    if (tier === 'FREE') {
      router.push('/dashboard')
      return
    }

    setLoadingPlanId(planId)
    checkoutMutation.mutate(planId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  const plans = plansData || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with a 14-day free trial. No credit card required.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan: any) => {
            const Icon = TIER_ICONS[plan.tier as keyof typeof TIER_ICONS]
            const isCurrentPlan =
              currentSubscription?.plan?.tier === plan.tier
            const isPro = plan.tier === 'PRO'

            return (
              <Card
                key={plan.id}
                className={`relative p-8 ${
                  isPro
                    ? 'border-2 border-purple-500 shadow-xl scale-105'
                    : 'border border-gray-200'
                }`}
              >
                {isPro && (
                  <Badge className="absolute top-4 right-4 bg-purple-600">
                    Most Popular
                  </Badge>
                )}

                <div className="mb-6">
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${
                      plan.tier === 'FREE'
                        ? 'from-gray-100 to-gray-200'
                        : plan.tier === 'PRO'
                        ? 'from-purple-100 to-purple-200'
                        : 'from-amber-100 to-amber-200'
                    } mb-4`}
                  >
                    <Icon
                      className={`h-6 w-6 ${TIER_COLORS[plan.tier as keyof typeof TIER_COLORS]}`}
                    />
                  </div>

                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {plan.description}
                  </p>

                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold">
                        ${(plan.price / 100).toFixed(0)}
                      </span>
                      <span className="text-gray-600 ml-2">/month</span>
                    </div>
                    {plan.tier !== 'FREE' && (
                      <p className="text-sm text-gray-500 mt-1">
                        14-day free trial included
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  className={`w-full mb-6 ${
                    isPro
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : plan.tier === 'BUSINESS'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : ''
                  }`}
                  variant={plan.tier === 'FREE' ? 'outline' : 'default'}
                  onClick={() => handleSelectPlan(plan.id, plan.tier)}
                  disabled={
                    isCurrentPlan || loadingPlanId === plan.id
                  }
                >
                  {loadingPlanId === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : plan.tier === 'FREE' ? (
                    'Get Started'
                  ) : (
                    'Start Free Trial'
                  )}
                </Button>

                <div className="space-y-3">
                  {plan.features?.included?.map(
                    (feature: string, index: number) => (
                      <div key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">
                          {feature}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4 text-left">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2">
                Can I change plans later?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time.
                Changes will be prorated to your billing cycle.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2">
                What happens after the free trial?
              </h3>
              <p className="text-gray-600">
                After your 14-day trial, you'll be charged for your
                selected plan. You can cancel anytime during the trial
                without being charged.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2">
                Can I cancel my subscription?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time from
                your account settings. You'll retain access until the end
                of your billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

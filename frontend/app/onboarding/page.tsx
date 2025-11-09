'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Sparkles,
  Twitter,
  Facebook,
  Linkedin,
  Instagram,
  Loader2,
  CheckCircle,
} from 'lucide-react'
import { userApi, brandProfilesApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const STEPS = [
  { id: 1, name: 'Welcome', icon: Sparkles },
  { id: 2, name: 'Brand Setup', icon: Sparkles },
  { id: 3, name: 'API Keys Guide', icon: ExternalLink },
  { id: 4, name: 'Complete', icon: CheckCircle },
]

const PLATFORM_GUIDES = {
  twitter: {
    name: 'Twitter (X)',
    icon: Twitter,
    color: 'bg-blue-500',
    steps: [
      'Go to https://developer.twitter.com/en/portal/dashboard',
      'Create a new project and app',
      'Navigate to your app settings',
      'Under "User authentication settings", set up OAuth 2.0',
      'Copy your API Key, API Secret, Bearer Token',
      'Add these to your account settings in our platform',
    ],
    docsUrl: 'https://developer.twitter.com/en/docs/twitter-api/getting-started/getting-access-to-the-twitter-api',
  },
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600',
    steps: [
      'Go to https://developers.facebook.com/',
      'Create a new app or select an existing one',
      'Add "Facebook Login" product to your app',
      'Navigate to Settings > Basic',
      'Copy your App ID and App Secret',
      'Under Facebook Login settings, add your OAuth redirect URIs',
    ],
    docsUrl: 'https://developers.facebook.com/docs/facebook-login',
  },
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-pink-500',
    steps: [
      'Instagram uses Facebook Graph API',
      'Follow the Facebook setup steps above',
      'Add "Instagram Basic Display" to your Facebook app',
      'Connect your Instagram business account',
      'Generate an access token',
      'Add the token to your account settings',
    ],
    docsUrl: 'https://developers.facebook.com/docs/instagram-basic-display-api/getting-started',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'bg-blue-700',
    steps: [
      'Go to https://www.linkedin.com/developers/apps',
      'Create a new app',
      'Fill in your application details',
      'Under "Auth" tab, copy Client ID and Client Secret',
      'Add OAuth 2.0 redirect URLs',
      'Request the necessary scopes (r_liteprofile, w_member_social)',
    ],
    docsUrl: 'https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication',
  },
}

export default function OnboardingPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [brandData, setBrandData] = useState({
    name: '',
    tagline: '',
    description: '',
    brandVoice: '',
    values: [] as string[],
  })
  const [newValue, setNewValue] = useState('')

  const updateUserMutation = useMutation({
    mutationFn: async () => {
      await userApi.updateProfile({ onboardingCompleted: true } as any)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      router.push('/dashboard')
    },
  })

  const createBrandMutation = useMutation({
    mutationFn: async () => {
      if (brandData.name) {
        await brandProfilesApi.create({
          ...brandData,
          isActive: true,
        })
      }
    },
  })

  const handleNext = async () => {
    if (currentStep === 2) {
      // Save brand profile
      if (brandData.name) {
        await createBrandMutation.mutateAsync()
      }
    }

    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    } else {
      // Mark onboarding as complete
      await updateUserMutation.mutateAsync()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = async () => {
    await updateUserMutation.mutateAsync()
  }

  const addValue = () => {
    if (newValue.trim()) {
      setBrandData({
        ...brandData,
        values: [...brandData.values, newValue.trim()],
      })
      setNewValue('')
    }
  }

  const removeValue = (index: number) => {
    setBrandData({
      ...brandData,
      values: brandData.values.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                        isCompleted
                          ? 'bg-purple-600 border-purple-600'
                          : isActive
                          ? 'border-purple-600 bg-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-6 w-6 text-white" />
                      ) : (
                        <Icon
                          className={`h-6 w-6 ${
                            isActive ? 'text-purple-600' : 'text-gray-400'
                          }`}
                        />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-sm ${
                        isActive || isCompleted
                          ? 'text-gray-900 font-medium'
                          : 'text-gray-500'
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        currentStep > step.id ? 'bg-purple-600' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-8">
            {currentStep === 1 && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 mb-6">
                  <Sparkles className="h-8 w-8 text-purple-600" />
                </div>
                <h2 className="text-3xl font-bold mb-4">
                  Welcome to AI Social Media Manager!
                </h2>
                <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                  Let's get you set up in just a few steps. We'll help you define your brand,
                  connect your social media accounts, and start creating amazing content.
                </p>
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <Sparkles className="h-8 w-8 text-purple-600 mb-3 mx-auto" />
                    <h3 className="font-semibold mb-2">Define Your Brand</h3>
                    <p className="text-sm text-gray-600">
                      Set up your brand identity so AI can create content that matches your voice
                    </p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <ExternalLink className="h-8 w-8 text-blue-600 mb-3 mx-auto" />
                    <h3 className="font-semibold mb-2">Connect Accounts</h3>
                    <p className="text-sm text-gray-600">
                      Follow our guides to get API keys for your social platforms
                    </p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-600 mb-3 mx-auto" />
                    <h3 className="font-semibold mb-2">Start Creating</h3>
                    <p className="text-sm text-gray-600">
                      Use AI to generate, schedule, and publish content across all platforms
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h2 className="text-2xl font-bold mb-2">Set Up Your Brand</h2>
                <p className="text-gray-600 mb-6">
                  Tell us about your brand so our AI can create content that matches your voice and values.
                </p>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Brand Name *</Label>
                    <Input
                      id="name"
                      placeholder="My Awesome Brand"
                      value={brandData.name}
                      onChange={(e) =>
                        setBrandData({ ...brandData, name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      placeholder="Innovating the future"
                      value={brandData.tagline}
                      onChange={(e) =>
                        setBrandData({ ...brandData, tagline: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell us about your brand, what you do, and who you serve..."
                      value={brandData.description}
                      onChange={(e) =>
                        setBrandData({ ...brandData, description: e.target.value })
                      }
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="brandVoice">Brand Voice</Label>
                    <Textarea
                      id="brandVoice"
                      placeholder="e.g., Professional yet approachable, innovative, customer-focused..."
                      value={brandData.brandVoice}
                      onChange={(e) =>
                        setBrandData({ ...brandData, brandVoice: e.target.value })
                      }
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>Core Values</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="e.g., Innovation"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addValue()}
                      />
                      <Button type="button" onClick={addValue}>
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {brandData.values.map((value, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                        >
                          {value}
                          <button
                            onClick={() => removeValue(index)}
                            className="ml-2 text-purple-600 hover:text-purple-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mt-4">
                  You can always update this later in the Brand Center
                </p>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h2 className="text-2xl font-bold mb-2">Connect Your Social Accounts</h2>
                <p className="text-gray-600 mb-6">
                  Follow these guides to get API keys for each platform you want to connect.
                </p>

                <div className="space-y-4">
                  {Object.entries(PLATFORM_GUIDES).map(([key, platform]) => {
                    const Icon = platform.icon
                    return (
                      <Card key={key}>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <div className={`p-2 rounded-lg ${platform.color} mr-3`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            {platform.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ol className="space-y-2 mb-4">
                            {platform.steps.map((step, index) => (
                              <li key={index} className="flex items-start text-sm">
                                <span className="font-medium mr-2">{index + 1}.</span>
                                <span className="text-gray-700">{step}</span>
                              </li>
                            ))}
                          </ol>
                          <a
                            href={platform.docsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700"
                          >
                            View Official Documentation
                            <ExternalLink className="h-4 w-4 ml-1" />
                          </a>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                <p className="text-sm text-gray-500 mt-4">
                  You can add your API keys after onboarding in Settings → Accounts
                </p>
              </div>
            )}

            {currentStep === 4 && (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-green-200 mb-6">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold mb-4">You're All Set!</h2>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  Your account is ready to go. Start creating amazing content with AI, schedule posts,
                  and grow your social media presence!
                </p>
                <div className="grid md:grid-cols-2 gap-4 max-w-md mx-auto">
                  <Button
                    onClick={() => router.push('/dashboard/compose')}
                    variant="outline"
                  >
                    Create First Post
                  </Button>
                  <Button onClick={() => router.push('/dashboard/accounts')}>
                    Connect Accounts
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <div>
            {currentStep > 1 && currentStep < STEPS.length && (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStep < STEPS.length - 1 && (
              <Button variant="ghost" onClick={handleSkip}>
                Skip for now
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={
                (currentStep === 2 && !brandData.name) ||
                updateUserMutation.isPending ||
                createBrandMutation.isPending
              }
            >
              {updateUserMutation.isPending || createBrandMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : currentStep === STEPS.length ? (
                'Go to Dashboard'
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

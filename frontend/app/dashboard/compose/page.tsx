'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { socialAccountsApi, postsApi, aiApi, brandProfilesApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Twitter,
  Facebook,
  Linkedin,
  Instagram,
  Image as ImageIcon,
  Calendar,
  Sparkles,
  Hash,
  Send,
  Clock,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const platformIcons = {
  TWITTER: Twitter,
  FACEBOOK: Facebook,
  LINKEDIN: Linkedin,
  INSTAGRAM: Instagram,
}

const platformLimits = {
  TWITTER: 280,
  FACEBOOK: 63206,
  LINKEDIN: 3000,
  INSTAGRAM: 2200,
}

export default function ComposePage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [content, setContent] = useState('')
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [scheduledFor, setScheduledFor] = useState('')
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiProvider, setAiProvider] = useState('openai')
  const [isGenerating, setIsGenerating] = useState(false)

  const { data: accounts } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: async () => {
      const res = await socialAccountsApi.getAll()
      return res.data.data
    },
  })

  const { data: brandProfile } = useQuery({
    queryKey: ['active-brand-profile'],
    queryFn: async () => {
      const res = await brandProfilesApi.getActive()
      return res.data.data
    },
  })

  const createPostMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await postsApi.create(data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-posts'] })
      router.push('/dashboard')
    },
  })

  const generateContentMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const brandContext = brandProfile ? {
        name: brandProfile.name,
        brandVoice: brandProfile.brandVoice,
        toneAttributes: brandProfile.toneAttributes,
        writingStyle: brandProfile.writingStyle,
        values: brandProfile.values,
        keywords: brandProfile.keywords,
        hashtags: brandProfile.hashtags,
        dosList: brandProfile.dosList,
        dontsList: brandProfile.dontsList,
        targetAudience: brandProfile.targetAudience,
      } : undefined

      const res = await aiApi.generate({
        prompt,
        provider: aiProvider,
        brandContext
      })
      return res.data.data.content
    },
    onSuccess: (data) => {
      setContent(data)
      setAiDialogOpen(false)
    },
  })

  const improveContentMutation = useMutation({
    mutationFn: async () => {
      const brandContext = brandProfile ? {
        name: brandProfile.name,
        brandVoice: brandProfile.brandVoice,
        toneAttributes: brandProfile.toneAttributes,
        writingStyle: brandProfile.writingStyle,
        values: brandProfile.values,
        keywords: brandProfile.keywords,
        dosList: brandProfile.dosList,
        dontsList: brandProfile.dontsList,
        targetAudience: brandProfile.targetAudience,
      } : undefined

      const res = await aiApi.improve({
        content,
        provider: aiProvider,
        brandContext
      })
      return res.data.data.content
    },
    onSuccess: (data) => {
      setContent(data)
    },
  })

  const generateHashtagsMutation = useMutation({
    mutationFn: async () => {
      const brandContext = brandProfile ? {
        hashtags: brandProfile.hashtags,
      } : undefined

      const res = await aiApi.generateHashtags({
        content,
        brandContext
      })
      return res.data.data.hashtags
    },
    onSuccess: (hashtags) => {
      const hashtagString = hashtags.map((tag: string) => `#${tag}`).join(' ')
      setContent(prev => `${prev}\n\n${hashtagString}`)
    },
  })

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }

  const getCharacterCount = () => {
    if (selectedAccounts.length === 0) return content.length

    const selectedPlatforms = accounts
      ?.filter((acc: any) => selectedAccounts.includes(acc.id))
      .map((acc: any) => acc.platform) || []

    const limits = selectedPlatforms.map(platform => platformLimits[platform as keyof typeof platformLimits])
    const minLimit = Math.min(...limits)

    return {
      current: content.length,
      max: minLimit,
      isOverLimit: content.length > minLimit
    }
  }

  const handleGenerateAI = () => {
    setIsGenerating(true)
    generateContentMutation.mutate(aiPrompt, {
      onSettled: () => setIsGenerating(false)
    })
  }

  const handlePost = (publishNow: boolean) => {
    if (selectedAccounts.length === 0) {
      alert('Please select at least one account')
      return
    }

    if (!content.trim()) {
      alert('Please add content to your post')
      return
    }

    // Create a post for each selected account
    selectedAccounts.forEach(accountId => {
      createPostMutation.mutate({
        socialAccountId: accountId,
        content,
        mediaUrls,
        publishNow,
        scheduledFor: !publishNow && scheduledFor ? scheduledFor : null,
      })
    })
  }

  const charCount = getCharacterCount()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Post</h1>
            <p className="text-gray-500 mt-1">
              Compose and schedule posts across your social media accounts
            </p>
          </div>
          {brandProfile && (
            <Badge variant="default" className="flex items-center">
              <Sparkles className="mr-1 h-4 w-4" />
              Using "{brandProfile.name}" brand profile
            </Badge>
          )}
        </div>
        {!brandProfile && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start justify-between">
            <div className="flex items-start">
              <Sparkles className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Create a brand profile for better AI content</p>
                <p className="text-sm text-blue-700 mt-1">
                  Define your brand voice, values, and guidelines to generate on-brand content automatically.
                </p>
              </div>
            </div>
            <Link href="/dashboard/brand-center">
              <Button variant="outline" size="sm">
                Create Profile
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Account Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Platforms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {accounts?.map((account: any) => {
              const Icon = platformIcons[account.platform as keyof typeof platformIcons]
              const isSelected = selectedAccounts.includes(account.id)

              return (
                <button
                  key={account.id}
                  onClick={() => toggleAccount(account.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">@{account.username}</span>
                </button>
              )
            })}
            {(!accounts || accounts.length === 0) && (
              <p className="text-gray-500">No accounts connected. Please connect an account first.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Composer */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Content</CardTitle>
            <div className="flex items-center space-x-2">
              {/* AI Generate */}
              <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI Generate
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate Content with AI</DialogTitle>
                    <DialogDescription>
                      Describe what you want to post about, and AI will create content for you.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>AI Provider</Label>
                      <Select value={aiProvider} onValueChange={setAiProvider}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                          <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>What would you like to post about?</Label>
                      <Textarea
                        placeholder="E.g., '5 productivity tips for remote workers' or 'announce our new product feature'"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <Button
                      onClick={handleGenerateAI}
                      disabled={!aiPrompt || isGenerating}
                      className="w-full"
                    >
                      {isGenerating ? 'Generating...' : 'Generate Content'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* AI Improve */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => improveContentMutation.mutate()}
                disabled={!content || improveContentMutation.isPending}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {improveContentMutation.isPending ? 'Improving...' : 'AI Improve'}
              </Button>

              {/* Generate Hashtags */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateHashtagsMutation.mutate()}
                disabled={!content || generateHashtagsMutation.isPending}
              >
                <Hash className="mr-2 h-4 w-4" />
                {generateHashtagsMutation.isPending ? 'Generating...' : 'Add Hashtags'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="resize-none"
          />

          {/* Character Counter */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <ImageIcon className="mr-2 h-4 w-4" />
                Add Media
              </Button>
            </div>
            <div className={`font-medium ${charCount.isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
              {charCount.current} / {charCount.max} characters
            </div>
          </div>

          {/* Media Preview */}
          {mediaUrls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {mediaUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Media ${index + 1}`}
                    className="h-20 w-20 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setMediaUrls(prev => prev.filter((_, i) => i !== index))}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Previews */}
      {selectedAccounts.length > 0 && content && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {accounts
              ?.filter((acc: any) => selectedAccounts.includes(acc.id))
              .map((account: any) => {
                const Icon = platformIcons[account.platform as keyof typeof platformIcons]
                return (
                  <div key={account.id} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Icon className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">@{account.username}</span>
                      <Badge variant="outline">{account.platform}</Badge>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>
                    {mediaUrls.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {mediaUrls.slice(0, 4).map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt={`Preview ${i}`}
                            className="w-full h-32 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
          </CardContent>
        </Card>
      )}

      {/* Schedule & Publish */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Schedule for later (optional)</Label>
            <Input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="mt-2"
            />
          </div>

          <div className="flex items-center space-x-3">
            <Button
              onClick={() => handlePost(true)}
              disabled={createPostMutation.isPending || !content || selectedAccounts.length === 0}
              size="lg"
              className="flex-1"
            >
              <Send className="mr-2 h-5 w-5" />
              {createPostMutation.isPending ? 'Posting...' : 'Post Now'}
            </Button>

            <Button
              onClick={() => handlePost(false)}
              disabled={createPostMutation.isPending || !content || selectedAccounts.length === 0 || !scheduledFor}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              <Clock className="mr-2 h-5 w-5" />
              Schedule Post
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

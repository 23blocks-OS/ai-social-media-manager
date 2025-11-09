'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { brandProfilesApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Palette,
  FileText,
  Target,
  Heart,
  MessageSquare,
  Image as ImageIcon,
  Plus,
  Check,
  X,
  Upload,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'

export default function BrandCenterPage() {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<any>({
    name: '',
    tagline: '',
    description: '',
    brandVoice: '',
    toneAttributes: [],
    writingStyle: '',
    targetAudience: '',
    mission: '',
    vision: '',
    values: [],
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    accentColor: '#F59E0B',
    keywords: [],
    hashtags: [],
    dosList: [],
    dontsList: [],
    contentThemes: [],
  })

  const [newValue, setNewValue] = useState('')
  const [newKeyword, setNewKeyword] = useState('')
  const [newHashtag, setNewHashtag] = useState('')
  const [newDo, setNewDo] = useState('')
  const [newDont, setNewDont] = useState('')
  const [newTheme, setNewTheme] = useState('')
  const [newToneAttr, setNewToneAttr] = useState('')

  const { data: profiles } = useQuery({
    queryKey: ['brand-profiles'],
    queryFn: async () => {
      const res = await brandProfilesApi.getAll()
      return res.data.data
    },
  })

  const { data: activeProfile } = useQuery({
    queryKey: ['active-brand-profile'],
    queryFn: async () => {
      const res = await brandProfilesApi.getActive()
      return res.data.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await brandProfilesApi.create(data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-profiles'] })
      queryClient.invalidateQueries({ queryKey: ['active-brand-profile'] })
      setIsEditing(false)
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await brandProfilesApi.update(id, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-profiles'] })
      queryClient.invalidateQueries({ queryKey: ['active-brand-profile'] })
      setIsEditing(false)
    },
  })

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      await brandProfilesApi.activate(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-profiles'] })
      queryClient.invalidateQueries({ queryKey: ['active-brand-profile'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await brandProfilesApi.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-profiles'] })
      queryClient.invalidateQueries({ queryKey: ['active-brand-profile'] })
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      tagline: '',
      description: '',
      brandVoice: '',
      toneAttributes: [],
      writingStyle: '',
      targetAudience: '',
      mission: '',
      vision: '',
      values: [],
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      accentColor: '#F59E0B',
      keywords: [],
      hashtags: [],
      dosList: [],
      dontsList: [],
      contentThemes: [],
    })
  }

  const handleEdit = () => {
    if (activeProfile) {
      setFormData({
        ...activeProfile,
        toneAttributes: activeProfile.toneAttributes || [],
        values: activeProfile.values || [],
        keywords: activeProfile.keywords || [],
        hashtags: activeProfile.hashtags || [],
        dosList: activeProfile.dosList || [],
        dontsList: activeProfile.dontsList || [],
        contentThemes: activeProfile.contentThemes || [],
      })
    }
    setIsEditing(true)
  }

  const handleSave = () => {
    if (activeProfile) {
      updateMutation.mutate({
        id: activeProfile.id,
        data: formData,
      })
    } else {
      createMutation.mutate({ ...formData, isActive: true })
    }
  }

  const addToArray = (field: string, value: string, setter: Function) => {
    if (value.trim()) {
      setFormData((prev: any) => ({
        ...prev,
        [field]: [...(prev[field] || []), value.trim()],
      }))
      setter('')
    }
  }

  const removeFromArray = (field: string, index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field].filter((_: any, i: number) => i !== index),
    }))
  }

  const currentProfile = isEditing ? formData : activeProfile

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brand Center</h1>
          <p className="text-gray-500 mt-1">
            Define your brand identity to create AI-powered, on-brand content
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {activeProfile && !isEditing && (
            <Badge variant="default" className="flex items-center">
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Active Profile
            </Badge>
          )}
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  if (activeProfile) {
                    setFormData(activeProfile)
                  } else {
                    resetForm()
                  }
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Check className="mr-2 h-4 w-4" />
                Save Profile
              </Button>
            </>
          ) : (
            <Button onClick={handleEdit}>
              {activeProfile ? 'Edit Profile' : 'Create Profile'}
            </Button>
          )}
        </div>
      </div>

      {!currentProfile && !isEditing ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <Sparkles className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Create Your Brand Profile
              </h3>
              <p className="text-gray-500 mb-6">
                Define your brand identity, voice, and guidelines to ensure all AI-generated
                content aligns with your brand.
              </p>
              <Button onClick={() => setIsEditing(true)} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Get Started
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="identity" className="space-y-6">
          <TabsList>
            <TabsTrigger value="identity">Brand Identity</TabsTrigger>
            <TabsTrigger value="voice">Voice & Tone</TabsTrigger>
            <TabsTrigger value="visual">Visual Identity</TabsTrigger>
            <TabsTrigger value="guidelines">Content Guidelines</TabsTrigger>
            <TabsTrigger value="examples">Examples & Themes</TabsTrigger>
          </TabsList>

          {/* Brand Identity Tab */}
          <TabsContent value="identity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Core details about your brand
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Brand Name *</Label>
                  <Input
                    value={currentProfile?.name || ''}
                    onChange={(e) =>
                      setFormData((prev: any) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Your Company Name"
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label>Tagline</Label>
                  <Input
                    value={currentProfile?.tagline || ''}
                    onChange={(e) =>
                      setFormData((prev: any) => ({ ...prev, tagline: e.target.value }))
                    }
                    placeholder="Your brand's tagline or slogan"
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={currentProfile?.description || ''}
                    onChange={(e) =>
                      setFormData((prev: any) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Brief description of your brand"
                    rows={4}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="mr-2 h-5 w-5" />
                  Mission & Vision
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Mission Statement</Label>
                  <Textarea
                    value={currentProfile?.mission || ''}
                    onChange={(e) =>
                      setFormData((prev: any) => ({ ...prev, mission: e.target.value }))
                    }
                    placeholder="What is your brand's purpose?"
                    rows={3}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label>Vision Statement</Label>
                  <Textarea
                    value={currentProfile?.vision || ''}
                    onChange={(e) =>
                      setFormData((prev: any) => ({ ...prev, vision: e.target.value }))
                    }
                    placeholder="Where do you see your brand in the future?"
                    rows={3}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="mr-2 h-5 w-5" />
                  Core Values
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing && (
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="Add a core value"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addToArray('values', newValue, setNewValue)
                        }
                      }}
                    />
                    <Button
                      onClick={() => addToArray('values', newValue, setNewValue)}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {currentProfile?.values?.map((value: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {value}
                      {isEditing && (
                        <button
                          onClick={() => removeFromArray('values', index)}
                          className="ml-2"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  {(!currentProfile?.values || currentProfile.values.length === 0) && (
                    <p className="text-sm text-gray-500">No values added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Target Audience</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={currentProfile?.targetAudience || ''}
                  onChange={(e) =>
                    setFormData((prev: any) => ({ ...prev, targetAudience: e.target.value }))
                  }
                  placeholder="Describe your ideal customer or audience"
                  rows={4}
                  disabled={!isEditing}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voice & Tone Tab */}
          <TabsContent value="voice" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Brand Voice
                </CardTitle>
                <CardDescription>
                  How should your brand sound in communications?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Brand Voice</Label>
                  <Textarea
                    value={currentProfile?.brandVoice || ''}
                    onChange={(e) =>
                      setFormData((prev: any) => ({ ...prev, brandVoice: e.target.value }))
                    }
                    placeholder="e.g., Professional, friendly, authoritative, casual, playful"
                    rows={3}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label>Writing Style</Label>
                  <Textarea
                    value={currentProfile?.writingStyle || ''}
                    onChange={(e) =>
                      setFormData((prev: any) => ({ ...prev, writingStyle: e.target.value }))
                    }
                    placeholder="e.g., Concise, storytelling, data-driven, conversational"
                    rows={3}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tone Attributes</CardTitle>
                <CardDescription>
                  Adjectives that describe your brand's personality
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing && (
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={newToneAttr}
                      onChange={(e) => setNewToneAttr(e.target.value)}
                      placeholder="Add a tone attribute"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addToArray('toneAttributes', newToneAttr, setNewToneAttr)
                        }
                      }}
                    />
                    <Button
                      onClick={() => addToArray('toneAttributes', newToneAttr, setNewToneAttr)}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {currentProfile?.toneAttributes?.map((attr: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {attr}
                      {isEditing && (
                        <button
                          onClick={() => removeFromArray('toneAttributes', index)}
                          className="ml-2"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  {(!currentProfile?.toneAttributes ||
                    currentProfile.toneAttributes.length === 0) && (
                    <p className="text-sm text-gray-500">
                      No tone attributes added yet. Examples: authentic, innovative, trustworthy
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visual Identity Tab */}
          <TabsContent value="visual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="mr-2 h-5 w-5" />
                  Brand Colors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Primary Color</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="color"
                        value={currentProfile?.primaryColor || '#3B82F6'}
                        onChange={(e) =>
                          setFormData((prev: any) => ({ ...prev, primaryColor: e.target.value }))
                        }
                        className="h-10 w-20 rounded cursor-pointer"
                        disabled={!isEditing}
                      />
                      <Input
                        value={currentProfile?.primaryColor || ''}
                        onChange={(e) =>
                          setFormData((prev: any) => ({ ...prev, primaryColor: e.target.value }))
                        }
                        placeholder="#3B82F6"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Secondary Color</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="color"
                        value={currentProfile?.secondaryColor || '#10B981'}
                        onChange={(e) =>
                          setFormData((prev: any) => ({ ...prev, secondaryColor: e.target.value }))
                        }
                        className="h-10 w-20 rounded cursor-pointer"
                        disabled={!isEditing}
                      />
                      <Input
                        value={currentProfile?.secondaryColor || ''}
                        onChange={(e) =>
                          setFormData((prev: any) => ({ ...prev, secondaryColor: e.target.value }))
                        }
                        placeholder="#10B981"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Accent Color</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="color"
                        value={currentProfile?.accentColor || '#F59E0B'}
                        onChange={(e) =>
                          setFormData((prev: any) => ({ ...prev, accentColor: e.target.value }))
                        }
                        className="h-10 w-20 rounded cursor-pointer"
                        disabled={!isEditing}
                      />
                      <Input
                        value={currentProfile?.accentColor || ''}
                        onChange={(e) =>
                          setFormData((prev: any) => ({ ...prev, accentColor: e.target.value }))
                        }
                        placeholder="#F59E0B"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ImageIcon className="mr-2 h-5 w-5" />
                  Brand Assets
                </CardTitle>
                <CardDescription>
                  Upload your logo and brand guidelines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Logo URL</Label>
                  <Input
                    value={currentProfile?.logoUrl || ''}
                    onChange={(e) =>
                      setFormData((prev: any) => ({ ...prev, logoUrl: e.target.value }))
                    }
                    placeholder="https://example.com/logo.png"
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label>Style Guide URL</Label>
                  <Input
                    value={currentProfile?.styleGuideUrl || ''}
                    onChange={(e) =>
                      setFormData((prev: any) => ({ ...prev, styleGuideUrl: e.target.value }))
                    }
                    placeholder="https://example.com/style-guide.pdf"
                    disabled={!isEditing}
                  />
                </div>

                {isEditing && (
                  <Button variant="outline" className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Files
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Guidelines Tab */}
          <TabsContent value="guidelines" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Important Keywords</CardTitle>
                <CardDescription>
                  Keywords that should be included in your content
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing && (
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Add a keyword"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addToArray('keywords', newKeyword, setNewKeyword)
                        }
                      }}
                    />
                    <Button
                      onClick={() => addToArray('keywords', newKeyword, setNewKeyword)}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {currentProfile?.keywords?.map((keyword: string, index: number) => (
                    <Badge key={index} variant="default" className="text-sm">
                      {keyword}
                      {isEditing && (
                        <button
                          onClick={() => removeFromArray('keywords', index)}
                          className="ml-2"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  {(!currentProfile?.keywords || currentProfile.keywords.length === 0) && (
                    <p className="text-sm text-gray-500">No keywords added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preferred Hashtags</CardTitle>
                <CardDescription>
                  Hashtags that represent your brand
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing && (
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={newHashtag}
                      onChange={(e) => setNewHashtag(e.target.value)}
                      placeholder="Add a hashtag (without #)"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addToArray('hashtags', newHashtag, setNewHashtag)
                        }
                      }}
                    />
                    <Button
                      onClick={() => addToArray('hashtags', newHashtag, setNewHashtag)}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {currentProfile?.hashtags?.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      #{tag}
                      {isEditing && (
                        <button
                          onClick={() => removeFromArray('hashtags', index)}
                          className="ml-2"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  {(!currentProfile?.hashtags || currentProfile.hashtags.length === 0) && (
                    <p className="text-sm text-gray-500">No hashtags added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-green-600">
                    <Check className="mr-2 h-5 w-5" />
                    Do's
                  </CardTitle>
                  <CardDescription>Things to include in content</CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditing && (
                    <div className="flex gap-2 mb-4">
                      <Input
                        value={newDo}
                        onChange={(e) => setNewDo(e.target.value)}
                        placeholder="Add a guideline"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addToArray('dosList', newDo, setNewDo)
                          }
                        }}
                      />
                      <Button
                        onClick={() => addToArray('dosList', newDo, setNewDo)}
                        variant="outline"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <ul className="space-y-2">
                    {currentProfile?.dosList?.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="flex-1">{item}</span>
                        {isEditing && (
                          <button
                            onClick={() => removeFromArray('dosList', index)}
                            className="text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </li>
                    ))}
                    {(!currentProfile?.dosList || currentProfile.dosList.length === 0) && (
                      <p className="text-sm text-gray-500">No guidelines added yet</p>
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-red-600">
                    <X className="mr-2 h-5 w-5" />
                    Don'ts
                  </CardTitle>
                  <CardDescription>Things to avoid in content</CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditing && (
                    <div className="flex gap-2 mb-4">
                      <Input
                        value={newDont}
                        onChange={(e) => setNewDont(e.target.value)}
                        placeholder="Add a restriction"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addToArray('dontsList', newDont, setNewDont)
                          }
                        }}
                      />
                      <Button
                        onClick={() => addToArray('dontsList', newDont, setNewDont)}
                        variant="outline"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <ul className="space-y-2">
                    {currentProfile?.dontsList?.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <X className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <span className="flex-1">{item}</span>
                        {isEditing && (
                          <button
                            onClick={() => removeFromArray('dontsList', index)}
                            className="text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </li>
                    ))}
                    {(!currentProfile?.dontsList || currentProfile.dontsList.length === 0) && (
                      <p className="text-sm text-gray-500">No restrictions added yet</p>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Examples & Themes Tab */}
          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Themes</CardTitle>
                <CardDescription>
                  Common topics or themes for your content
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing && (
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={newTheme}
                      onChange={(e) => setNewTheme(e.target.value)}
                      placeholder="Add a content theme"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addToArray('contentThemes', newTheme, setNewTheme)
                        }
                      }}
                    />
                    <Button
                      onClick={() => addToArray('contentThemes', newTheme, setNewTheme)}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {currentProfile?.contentThemes?.map((theme: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {theme}
                      {isEditing && (
                        <button
                          onClick={() => removeFromArray('contentThemes', index)}
                          className="ml-2"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  {(!currentProfile?.contentThemes ||
                    currentProfile.contentThemes.length === 0) && (
                    <p className="text-sm text-gray-500">
                      No themes added yet. Examples: product updates, thought leadership, customer stories
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
                <CardDescription>
                  Any other brand guidelines or context for AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={currentProfile?.additionalNotes || ''}
                  onChange={(e) =>
                    setFormData((prev: any) => ({ ...prev, additionalNotes: e.target.value }))
                  }
                  placeholder="Add any additional context or guidelines..."
                  rows={6}
                  disabled={!isEditing}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Brand Profiles List */}
      {profiles && profiles.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>All Brand Profiles</CardTitle>
            <CardDescription>
              Manage multiple brand profiles for different products or services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profiles.map((profile: any) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{profile.name}</h4>
                    <p className="text-sm text-gray-500">{profile.tagline}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {profile.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => activateMutation.mutate(profile.id)}
                      >
                        Set Active
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this profile?')) {
                          deleteMutation.mutate(profile.id)
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

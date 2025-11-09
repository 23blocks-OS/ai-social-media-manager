'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { socialAccountsApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Plus,
  Power,
  PowerOff,
  Trash2,
  RefreshCw,
} from 'lucide-react'

const platformIcons = {
  TWITTER: Twitter,
  FACEBOOK: Facebook,
  LINKEDIN: Linkedin,
  INSTAGRAM: Instagram,
}

const platformColors = {
  TWITTER: 'bg-blue-500',
  FACEBOOK: 'bg-blue-600',
  LINKEDIN: 'bg-blue-700',
  INSTAGRAM: 'bg-pink-500',
}

export default function AccountsPage() {
  const queryClient = useQueryClient()
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const { data: accounts } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: async () => {
      const res = await socialAccountsApi.getAll()
      return res.data.data
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      await socialAccountsApi.toggle(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await socialAccountsApi.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] })
    },
  })

  const handleOAuthConnect = (platform: string) => {
    // Redirect to OAuth flow
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/${platform.toLowerCase()}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Connected Accounts</h1>
          <p className="text-gray-500 mt-1">
            Manage your social media accounts
          </p>
        </div>
        <Dialog open={addDialogOpen} onValueChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-5 w-5" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect Social Media Account</DialogTitle>
              <DialogDescription>
                Choose a platform to connect with OAuth
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {[
                { name: 'Twitter', value: 'TWITTER', icon: Twitter },
                { name: 'Facebook', value: 'FACEBOOK', icon: Facebook },
                { name: 'Instagram', value: 'INSTAGRAM', icon: Instagram },
                { name: 'LinkedIn', value: 'LINKEDIN', icon: Linkedin },
              ].map(({ name, value, icon: Icon }) => (
                <Button
                  key={value}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleOAuthConnect(value)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  Connect {name}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Connected Accounts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {accounts?.map((account: any) => {
          const Icon = platformIcons[account.platform as keyof typeof platformIcons]
          const colorClass = platformColors[account.platform as keyof typeof platformColors]

          return (
            <Card key={account.id} className="overflow-hidden">
              <div className={`h-2 ${colorClass}`} />
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {account.displayName || account.username}
                      </p>
                      <p className="text-sm text-gray-500">@{account.username}</p>
                    </div>
                  </div>
                  <Badge variant={account.isActive ? 'default' : 'secondary'}>
                    {account.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Platform</span>
                    <span className="font-medium">{account.platform}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Connected</span>
                    <span className="font-medium">
                      {new Date(account.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => toggleMutation.mutate(account.id)}
                    disabled={toggleMutation.isPending}
                  >
                    {account.isActive ? (
                      <>
                        <PowerOff className="mr-2 h-4 w-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Power className="mr-2 h-4 w-4" />
                        Activate
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to remove this account?')) {
                        deleteMutation.mutate(account.id)
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {(!accounts || accounts.length === 0) && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="flex justify-center space-x-4 mb-6">
                <Twitter className="h-12 w-12 text-gray-300" />
                <Facebook className="h-12 w-12 text-gray-300" />
                <Instagram className="h-12 w-12 text-gray-300" />
                <Linkedin className="h-12 w-12 text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No accounts connected
              </h3>
              <p className="text-gray-500 mb-6">
                Connect your social media accounts to start managing your content
              </p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="mr-2 h-5 w-5" />
                Connect Your First Account
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Before connecting accounts:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Create developer apps on each platform</li>
                <li>Configure OAuth callback URLs in the platform settings</li>
                <li>Add API credentials to your environment variables</li>
                <li>Review our setup guides for detailed instructions</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Setup Guides:</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Twitter Setup →</Badge>
                <Badge variant="outline">Facebook Setup →</Badge>
                <Badge variant="outline">Instagram Setup →</Badge>
                <Badge variant="outline">LinkedIn Setup →</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

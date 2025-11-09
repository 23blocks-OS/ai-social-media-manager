import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-6">
            AI Social Media Manager
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Self-hosted, AI-powered social media management platform. Manage all your social accounts
            with intelligent automation and analytics.
          </p>

          <div className="flex gap-4 justify-center mb-16">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8">
                Get Started
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign Up
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-16">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Generate engaging content, auto-reply to comments, and get smart suggestions
                with GPT-4 and Claude.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2">Multi-Platform</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Manage Twitter, Facebook, Instagram, LinkedIn, and TikTok from one dashboard.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Analytics</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Track engagement, reach, and performance across all your social accounts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken,
        })

        localStorage.setItem('accessToken', data.data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`

        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name?: string) =>
    api.post('/auth/register', { email, password, name }),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
}

// User API
export const userApi = {
  getMe: () => api.get('/users/me'),
  updateProfile: (data: { name?: string; avatar?: string }) =>
    api.patch('/users/me', data),
}

// Social Accounts API
export const socialAccountsApi = {
  getAll: () => api.get('/social-accounts'),
  add: (data: any) => api.post('/social-accounts', data),
  delete: (id: string) => api.delete(`/social-accounts/${id}`),
  toggle: (id: string) => api.patch(`/social-accounts/${id}/toggle`),
}

// Posts API
export const postsApi = {
  getAll: (params?: any) => api.get('/posts', { params }),
  create: (data: any) => api.post('/posts', data),
  update: (id: string, data: any) => api.patch(`/posts/${id}`, data),
  delete: (id: string) => api.delete(`/posts/${id}`),
  getAnalytics: (id: string) => api.get(`/posts/${id}/analytics`),
}

// AI API
export const aiApi = {
  generate: (data: any) => api.post('/ai/generate', data),
  improve: (data: any) => api.post('/ai/improve', data),
  generateHashtags: (data: any) => api.post('/ai/hashtags', data),
  analyzeSentiment: (data: any) => api.post('/ai/sentiment', data),
  generateReply: (data: any) => api.post('/ai/reply', data),
}

// Analytics API
export const analyticsApi = {
  getSummary: (params?: any) => api.get('/analytics/summary', { params }),
  getTopPosts: (params?: any) => api.get('/analytics/top-posts', { params }),
  getTimeline: (params?: any) => api.get('/analytics/timeline', { params }),
}

// Brand Profiles API
export const brandProfilesApi = {
  getAll: () => api.get('/brand-profiles'),
  getActive: () => api.get('/brand-profiles/active'),
  getById: (id: string) => api.get(`/brand-profiles/${id}`),
  create: (data: any) => api.post('/brand-profiles', data),
  update: (id: string, data: any) => api.patch(`/brand-profiles/${id}`, data),
  activate: (id: string) => api.patch(`/brand-profiles/${id}/activate`),
  delete: (id: string) => api.delete(`/brand-profiles/${id}`),
}

// Subscriptions API
export const subscriptionsApi = {
  getPlans: () => api.get('/subscriptions/plans'),
  getCurrent: () => api.get('/subscriptions/current'),
  getUsage: () => api.get('/subscriptions/usage'),
  createCheckout: (planId: string, successUrl: string, cancelUrl: string) =>
    api.post('/subscriptions/checkout', { planId, successUrl, cancelUrl }),
  createBillingPortal: (returnUrl: string) =>
    api.post('/subscriptions/billing-portal', { returnUrl }),
  cancelSubscription: (id: string) => api.post(`/subscriptions/${id}/cancel`),
  reactivateSubscription: (id: string) => api.post(`/subscriptions/${id}/reactivate`),
  updatePlan: (id: string, newPlanId: string) =>
    api.patch(`/subscriptions/${id}/plan`, { newPlanId }),

  // Admin endpoints
  admin: {
    getAllSubscriptions: (page = 1, limit = 50) =>
      api.get('/subscriptions/admin/all', { params: { page, limit } }),
    createPlan: (data: any) => api.post('/subscriptions/admin/plans', data),
    getAnalytics: () => api.get('/subscriptions/admin/analytics'),
  },
}

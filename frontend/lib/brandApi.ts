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

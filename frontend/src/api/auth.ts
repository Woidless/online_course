import api from './client'
import type { LoginResponse, User } from '../types'

export const authApi = {
  register: (data: {
    email: string
    full_name: string
    role: 'student' | 'teacher'
    password: string
    password2: string
  }) => api.post('/users/auth/register/', data),

  login: (data: { email: string; password: string }) =>
    api.post<LoginResponse>('/users/auth/login/', data),

  logout: (refresh: string) =>
    api.post('/users/auth/logout/', { refresh }),

  refreshToken: (refresh: string) =>
    api.post<{ access: string }>('/users/auth/token/refresh/', { refresh }),

  verifyEmail: (token: string) =>
    api.get(`/users/auth/verify-email/${token}/`),

  resetPasswordRequest: (email: string) =>
    api.post('/users/auth/password/reset/', { email }),

  resetPasswordConfirm: (data: {
    token: string
    new_password: string
    new_password2: string
  }) => api.post('/users/auth/password/reset/confirm/', data),

  changePassword: (data: {
    old_password: string
    new_password: string
    new_password2: string
  }) => api.post('/users/auth/password/change/', data),

  getMe: () => api.get<User>('/users/me/'),
}
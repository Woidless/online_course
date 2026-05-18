import api from './client'
import type { Payment, PaginatedResponse } from '../types'

export const paymentsApi = {
  list: () => api.get<PaginatedResponse<Payment>>('/payments/'),
  detail: (id: number) => api.get<Payment>(`/payments/${id}/`),
  createCheckout: (groupId: number) =>
    api.post<{ checkout_url: string }>('/payments/checkout/', { group_id: groupId }),
}
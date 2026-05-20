import api from './client'
import type { User, Course, CourseGroup, Enrollment, Payment, PaginatedResponse } from '../types'

export const adminApi = {
  // Пользователи
  getUsers: (role?: string, page = 1, search?: string) =>
    api.get<PaginatedResponse<User>>(
      `/users/?page=${page}${role ? `&role=${role}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`
    ),
  getUser: (id: number) => api.get<User>(`/users/${id}/`),
  updateUser: (id: number, data: Partial<User> & { role?: string }) =>
    api.patch<User>(`/users/${id}/`, data),
  blockUser: (id: number) => api.post(`/users/${id}/block/`),
  unblockUser: (id: number) => api.post(`/users/${id}/unblock/`),
  deleteUser: (id: number) => api.delete(`/users/${id}/delete/`),
  createUser: (data: { email: string; full_name: string; password: string; role: string }) =>
    api.post<User>('/users/create/', data),

  // Курсы
  getCourses: () => api.get<Course[]>('/courses/'),
  createCourse: (data: FormData) =>
    api.post<Course>('/courses/create/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateCourse: (id: number, data: Partial<Course>) =>
    api.patch<Course>(`/courses/${id}/`, data),
  deleteCourse: (id: number) => api.delete(`/courses/${id}/`),
  publishCourse: (id: number) => api.post(`/courses/${id}/publish/`),
  unpublishCourse: (id: number) => api.post(`/courses/${id}/unpublish/`),

  // Группы
  getGroups: (courseId: number) =>
    api.get<CourseGroup[]>(`/courses/${courseId}/groups/`),
  createGroup: (courseId: number, data: Partial<CourseGroup>) =>
    api.post<CourseGroup>(`/courses/${courseId}/groups/`, data),
  updateGroup: (id: number, data: Partial<CourseGroup>) =>
    api.patch<CourseGroup>(`/courses/groups/${id}/`, data),
  deleteGroup: (id: number) => api.delete(`/courses/groups/${id}/`),

  // Зачисления
  enrollStudent: (groupId: number, studentId: number) =>
    api.post<Enrollment>(`/courses/groups/${groupId}/enroll/`, { student_id: studentId }),
  getEnrollments: (groupId: number) =>
    api.get<Enrollment[]>(`/courses/groups/${groupId}/students/`),
  updateEnrollment: (id: number, data: { group?: number; status?: string }) =>
    api.patch<Enrollment>(`/courses/enrollments/${id}/`, data),
  deleteEnrollment: (id: number) =>
    api.delete(`/courses/enrollments/${id}/`),

  // Платежи
  getPayments: (page = 1) => api.get<PaginatedResponse<Payment>>(`/payments/?page=${page}`),
  confirmPayment: (id: number) => api.post<Payment>(`/payments/${id}/confirm/`),
}
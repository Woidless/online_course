import api from './client'
import type { Course, CourseGroup, Enrollment, CourseProgress } from '../types'

export const coursesApi = {
  list: () => api.get<Course[]>('/courses/'),
  my: () => api.get<Course[]>('/courses/my/'),
  detail: (id: number) => api.get<Course>(`/courses/${id}/`),
  create: (data: FormData) => api.post<Course>('/courses/create/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id: number, data: Partial<Course>) =>
    api.patch<Course>(`/courses/${id}/`, data),
  delete: (id: number) => api.delete(`/courses/${id}/`),
  publish: (id: number) => api.post(`/courses/${id}/publish/`),
  unpublish: (id: number) => api.post(`/courses/${id}/unpublish/`),
  progress: (courseId: number) =>
    api.get<CourseProgress>(`/courses/${courseId}/progress/`),

  // Groups
  getGroups: (courseId: number) =>
    api.get<CourseGroup[]>(`/courses/${courseId}/groups/`),
  createGroup: (courseId: number, data: Partial<CourseGroup>) =>
    api.post<CourseGroup>(`/courses/${courseId}/groups/`, data),
  getGroup: (id: number) => api.get<CourseGroup>(`/courses/groups/${id}/`),
  updateGroup: (id: number, data: Partial<CourseGroup>) =>
    api.patch<CourseGroup>(`/courses/groups/${id}/`, data),
  deleteGroup: (id: number) => api.delete(`/courses/groups/${id}/`),

  // Enrollments
  enroll: (groupId: number, studentId: number) =>
    api.post<Enrollment>(`/courses/groups/${groupId}/enroll/`, {
      student_id: studentId,
    }),
  getStudents: (groupId: number) =>
    api.get<Enrollment[]>(`/courses/groups/${groupId}/students/`),
}
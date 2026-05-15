import api from './client'
import type { Submission } from '../types'

export const teacherApi = {
  // Все сданные работы по уроку
  getSubmissions: (lessonId: number) =>
    api.get<Submission[]>(`/lessons/${lessonId}/submissions/`),

  // Все сданные работы по заданию
  getAssignmentSubmissions: (assignmentId: number) =>
    api.get<Submission[]>(`/assignments/${assignmentId}/submissions/`),

  // Выставить оценку
  gradeSubmission: (submissionId: number, data: { score: number; feedback: string }) =>
    api.post(`/submissions/${submissionId}/grade/`, data),

  // Список студентов (для записи в группу)
  getStudents: () =>
    api.get(`/users/?role=student`),
}
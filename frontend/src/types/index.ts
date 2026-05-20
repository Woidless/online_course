export type Role = 'student' | 'teacher' | 'admin'

export interface User {
  id: number
  email: string
  full_name: string
  role: Role
  avatar: string | null
  date_joined: string
  is_active: boolean
  is_superuser?: boolean
}

export interface Course {
  id: number
  title: string
  description: string
  cover: string | null
  teacher: User
  is_published: boolean
  is_free: boolean
  price: string | null
  has_live_sessions: boolean
  lessons_count: number
  is_enrolled: boolean | null
  created_at: string
  updated_at: string
}

export interface GroupBrief {
  id: number
  name: string
  starts_at: string
  is_enrollment_open: boolean
}

export interface CourseCatalog {
  id: number
  title: string
  description: string
  cover: string | null
  teacher: User
  is_free: boolean
  price: string | null
  has_live_sessions: boolean
  lessons_count: number
  groups: GroupBrief[]
}

export interface CourseGroup {
  id: number
  course: number
  course_title: string
  name: string
  teacher: number | null
  teacher_name: string
  starts_at: string
  ends_at: string | null
  is_enrollment_open: boolean
  students_count: number
  created_at: string
}

export interface Enrollment {
  id: number
  student: number
  student_name: string
  group: number
  group_name: string
  course_title: string
  status: 'active' | 'completed' | 'dropped'
  enrolled_at: string
}

export interface Section {
  id: number
  course: number
  title: string
  order: number
  lessons: Lesson[]
}

export interface Lesson {
  id: number
  course: number
  section: number | null
  title: string
  description: string
  content: string
  youtube_url: string | null
  colab_url: string | null
  order: number
  is_published: boolean
  materials: LessonMaterial[]
  is_completed: boolean | null
  created_at: string
  updated_at: string
}

export interface LessonMaterial {
  id: number
  title: string
  type: 'file' | 'presentation' | 'link'
  file: string | null
  url: string | null
  created_at: string
}

export interface LessonProgress {
  id: number
  lesson: number
  lesson_title: string
  completed: boolean
  completed_at: string | null
}

export interface Schedule {
  id: number
  group: number
  group_name: string
  course_title: string
  lesson: number
  lesson_title: string
  teacher: number | null
  teacher_name: string
  scheduled_at: string
  zoom_url: string | null
}

export interface Assignment {
  id: number
  lesson: number
  lesson_title: string
  lesson_colab_url: string | null
  title: string
  description: string
  due_date: string | null
  submissions_count: number | null
  created_at: string
  updated_at: string
}

export interface Grade {
  id: number
  feedback: string
  teacher_name: string
  graded_at: string
}

export interface Submission {
  id: number
  assignment: number
  assignment_title: string
  student: number
  student_name: string
  content: string
  file: string | null
  status: 'submitted' | 'graded' | 'returned'
  grade: Grade | null
  submitted_at: string
  updated_at: string
}

export interface Quiz {
  id: number
  lesson: number
  title: string
  description: string
  time_limit: number | null
  passing_score: number
  is_published: boolean
  questions_count: number
  questions: Question[]
  created_at: string
  updated_at: string
}

export interface Question {
  id: number
  text: string
  type: 'single' | 'multiple' | 'text'
  order: number
  points?: number
  answers: Answer[]
}

export interface Answer {
  id: number
  text: string
  is_correct?: boolean
}

export interface QuizAttempt {
  id: number
  quiz: number
  quiz_title: string
  student: number
  student_name: string
  status: 'in_progress' | 'completed' | 'timed_out'
  score: number | null
  passed: boolean | null
  answers: Record<string, unknown>
  started_at: string
  finished_at: string | null
}

export interface QuizResult {
  student_id: number
  student_name: string
  email: string
  lesson_title: string
  quiz_id: number
  quiz_title: string
  best_score: number
  passing_score: number
  passed: boolean
  attempt_count: number
  last_attempt: string | null
}

export interface Certificate {
  id: number
  uid: string
  student: number
  student_name: string
  course: number
  course_title: string
  pdf: string | null
  issued_at: string
  verify_url: string
}

export interface Payment {
  id: number
  student: number
  student_name: string
  group: number
  group_name: string
  course_title: string
  amount: string
  currency: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  status_display: string
  stripe_checkout_session_id: string | null
  created_at: string
  paid_at: string | null
}

export interface CourseProgress {
  course_id: number
  course_title: string
  total_lessons: number
  completed_lessons: number
  progress_percent: number
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginResponse extends AuthTokens {
  user: User
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
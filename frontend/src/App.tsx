import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { useAuthStore } from './store/authStore'
import { refreshSession } from './api/client'
import DashboardLayout from './components/layout/DashboardLayout'

// Auth
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

// Student
import StudentDashboard from './pages/student/StudentDashboard'
import StudentCourses from './pages/student/StudentCourses'
import StudentCoursePage from './pages/student/StudentCoursePage'
import StudentSchedule from './pages/student/StudentSchedule'
import StudentProfile from './pages/student/StudentProfile'
import StudentCourseCatalog from './pages/student/StudentCourseCatalog'
import StudentLessonPage from './pages/student/StudentLessonPage'
import StudentAssignmentPage from './pages/student/StudentAssignmentPage'
import StudentQuizPage from './pages/student/StudentQuizPage'
import PaymentSuccessPage from './pages/student/PaymentSuccessPage'
import PaymentCancelPage from './pages/student/PaymentCancelPage'
import CertificateVerifyPage from './pages/CertificateVerifyPage'

// Teacher
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherCourses from './pages/teacher/TeacherCourses'
import TeacherCoursePage from './pages/teacher/TeacherCoursePage'
import TeacherSchedule from './pages/teacher/TeacherSchedule'
import TeacherScheduleForm from './pages/teacher/TeacherScheduleForm'
import TeacherSubmissions from './pages/teacher/TeacherSubmissions'
import TeacherSubmissionDetail from './pages/teacher/TeacherSubmissionDetail'
import TeacherCourseForm from './pages/teacher/TeacherCourseForm'
import TeacherLessonForm from './pages/teacher/TeacherLessonForm'
import TeacherProfile from './pages/teacher/TeacherProfile'

// Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminCourses from './pages/admin/AdminCourses'
import AdminCourseForm from './pages/admin/AdminCourseForm'
import AdminCoursePage from './pages/admin/AdminCoursePage'
import AdminPayments from './pages/admin/AdminPayments'
import AdminReports from './pages/admin/AdminReports'

// Teacher (quiz form)
import TeacherQuizForm from './pages/teacher/TeacherQuizForm'

const HomeIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)
const BookIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)
const CalendarIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const UserIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)
const ClipboardIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)
const UsersIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)
const CreditCardIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
)
const ChartIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const studentNav = [
  { to: '/student', label: 'Главная', icon: <HomeIcon /> },
  { to: '/student/catalog', label: 'Каталог', icon: <BookIcon /> },
  { to: '/student/courses', label: 'Мои курсы', icon: <ClipboardIcon /> },
  { to: '/student/schedule', label: 'Расписание', icon: <CalendarIcon /> },
  { to: '/student/profile', label: 'Профиль', icon: <UserIcon /> },
]

const teacherNav = [
  { to: '/teacher', label: 'Главная', icon: <HomeIcon /> },
  { to: '/teacher/courses', label: 'Мои курсы', icon: <BookIcon /> },
  { to: '/teacher/schedule', label: 'Расписание', icon: <CalendarIcon /> },
  { to: '/teacher/submissions', label: 'Работы', icon: <ClipboardIcon /> },
  { to: '/teacher/profile', label: 'Профиль', icon: <UserIcon /> },
]

const adminNav = [
  { to: '/admin', label: 'Главная', icon: <HomeIcon /> },
  { to: '/admin/users', label: 'Пользователи', icon: <UsersIcon /> },
  { to: '/admin/courses', label: 'Курсы', icon: <BookIcon /> },
  { to: '/admin/payments', label: 'Платежи', icon: <CreditCardIcon /> },
  { to: '/admin/reports', label: 'Отчёты', icon: <ChartIcon /> },
]

function DashboardRedirect() {
  const { user } = useAuthStore()
  if (user?.role === 'student') return <Navigate to="/student" replace />
  if (user?.role === 'teacher') return <Navigate to="/teacher" replace />
  if (user?.role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  const { isAuthenticated, accessToken, logout } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && !accessToken) {
      refreshSession().catch(() => logout())
    }
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/cancel" element={<PaymentCancelPage />} />
        <Route path="/certificate/verify/:uid" element={<CertificateVerifyPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardRedirect />} />
        </Route>

        {/* Student */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student" element={<DashboardLayout navItems={studentNav} role="student" />}>
            <Route index element={<StudentDashboard />} />
            <Route path="catalog" element={<StudentCourseCatalog />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="schedule" element={<StudentSchedule />} />
            <Route path="courses" element={<StudentCourses />} />
            <Route path="courses/:id" element={<StudentCoursePage />} />
            <Route path="lessons/:id" element={<StudentLessonPage />} />
            <Route path="assignments/:id" element={<StudentAssignmentPage />} />
            <Route path="quizzes/:id" element={<StudentQuizPage />} />
          </Route>
        </Route>

        {/* Teacher */}
        <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
          <Route path="/teacher" element={<DashboardLayout navItems={teacherNav} role="teacher" />}>
            <Route index element={<TeacherDashboard />} />
            <Route path="courses" element={<TeacherCourses />} />
            <Route path="courses/create" element={<TeacherCourseForm />} />
            <Route path="courses/:id" element={<TeacherCoursePage />} />
            <Route path="courses/:id/edit" element={<TeacherCourseForm />} />
            <Route path="schedule" element={<TeacherSchedule />} />
            <Route path="schedule/create" element={<TeacherScheduleForm />} />
            <Route path="schedule/:id/edit" element={<TeacherScheduleForm />} />
            <Route path="submissions" element={<TeacherSubmissions />} />
            <Route path="submissions/:id" element={<TeacherSubmissionDetail />} />
            <Route path="profile" element={<TeacherProfile />} />
            <Route path="courses/:courseId/lessons/create" element={<TeacherLessonForm />} />
            <Route path="lessons/:lessonId/edit" element={<TeacherLessonForm />} />
            <Route path="lessons/:lessonId/quizzes/create" element={<TeacherQuizForm />} />
            <Route path="lessons/:lessonId/quizzes/:quizId/edit" element={<TeacherQuizForm />} />
          </Route>
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<DashboardLayout navItems={adminNav} role="admin" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="courses/create" element={<AdminCourseForm />} />
            <Route path="courses/:id" element={<AdminCoursePage />} />
            <Route path="courses/:id/edit" element={<AdminCourseForm />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="courses/:courseId/lessons/create" element={<TeacherLessonForm />} />
            <Route path="lessons/:lessonId/edit" element={<TeacherLessonForm />} />
            <Route path="lessons/:lessonId/quizzes/create" element={<TeacherQuizForm />} />
            <Route path="lessons/:lessonId/quizzes/:quizId/edit" element={<TeacherQuizForm />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
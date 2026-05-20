import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/auth'
import { coursesApi } from '../../api/courses'
import api from '../../api/client'
import type { Course, Schedule, Submission } from '../../types'

type Tab = 'overview' | 'account'

const inputCls = "w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

export default function TeacherProfile() {
  const { user, setUser } = useAuthStore()
  const [tab, setTab] = useState<Tab>('overview')

  const [courses, setCourses] = useState<Course[]>([])
  const [schedule, setSchedule] = useState<Schedule[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  // Account settings
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [saveOk, setSaveOk] = useState(false)
  const [passwords, setPasswords] = useState({ old_password: '', new_password: '', new_password2: '' })
  const [pwError, setPwError] = useState('')
  const [pwOk, setPwOk] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      coursesApi.my(),
      api.get<Schedule[]>('/schedule/'),
      api.get<{ results: Submission[] }>('/submissions/?status=submitted&page_size=5'),
    ]).then(([c, s, sub]) => {
      setCourses(c.data)
      setSchedule(s.data)
      setSubmissions(sub.data.results ?? sub.data as any)
    }).finally(() => setLoading(false))
  }, [])

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setSaveOk(false)
    try {
      const { data } = await api.patch('/users/me/', { full_name: fullName })
      setUser(data)
      setSaveOk(true)
    } finally { setSaving(false) }
  }

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (passwords.new_password !== passwords.new_password2) {
      setPwError('Пароли не совпадают')
      return
    }
    setPwError('')
    setPwOk(false)
    setPwSaving(true)
    try {
      await authApi.changePassword(passwords)
      setPwOk(true)
      setPasswords({ old_password: '', new_password: '', new_password2: '' })
    } catch (err: any) {
      setPwError(err.response?.data?.detail || 'Ошибка смены пароля')
    } finally { setPwSaving(false) }
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const totalLessons = courses.reduce((sum, c) => sum + (c.lessons_count || 0), 0)
  const publishedCourses = courses.filter(c => c.is_published).length
  const pendingSubmissions = submissions.length
  const upcomingSchedule = schedule
    .filter(s => new Date(s.scheduled_at) > new Date())
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Шапка профиля */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {user?.avatar
              ? <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-2xl" />
              : initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{user?.full_name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            <span className="inline-block mt-1.5 text-xs px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full font-medium">
              Преподаватель
            </span>
          </div>
        </div>

        {/* Быстрая статистика */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{courses.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Курсов</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{publishedCourses}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Опубликовано</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{totalLessons}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Уроков</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-semibold ${pendingSubmissions > 0 ? 'text-orange-500' : 'text-gray-900 dark:text-gray-100'}`}>
              {pendingSubmissions}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">На проверке</p>
          </div>
        </div>
      </div>

      {/* Табы */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {([['overview', 'Обзор'], ['account', 'Аккаунт']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === key
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}>
            {label}
            {key === 'overview' && pendingSubmissions > 0 && (
              <span className="ml-1.5 text-xs bg-orange-500 text-white rounded-full px-1.5 py-0.5">
                {pendingSubmissions}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Обзор */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Работы на проверке */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Работы на проверке
                {pendingSubmissions > 0 && (
                  <span className="ml-2 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">
                    {pendingSubmissions}
                  </span>
                )}
              </h2>
              <Link to="/teacher/submissions"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Все работы →
              </Link>
            </div>
            {submissions.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                <p className="text-gray-400 dark:text-gray-500 text-sm">Нет работ на проверке</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                {submissions.map(sub => (
                  <Link key={sub.id} to={`/teacher/submissions/${sub.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{sub.student_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sub.assignment_title}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                        Ожидает
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(sub.submitted_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Мои курсы */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Мои курсы</h2>
              <Link to="/teacher/courses"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Управление →
              </Link>
            </div>
            {courses.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                <p className="text-gray-400 dark:text-gray-500 text-sm mb-3">Нет курсов</p>
                <Link to="/teacher/courses/create"
                  className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  Создать курс
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {courses.slice(0, 4).map(course => (
                  <Link key={course.id} to={`/teacher/courses/${course.id}`}
                    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{course.title}</p>
                      <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full ${
                        course.is_published
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                      }`}>
                        {course.is_published ? 'Опубл.' : 'Черновик'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{course.lessons_count} уроков</span>
                      {course.is_free
                        ? <span className="text-green-600">Бесплатный</span>
                        : <span className="text-orange-500">{course.price} $</span>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Ближайшие занятия */}
          {upcomingSchedule.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Ближайшие занятия</h2>
                <Link to="/teacher/schedule"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Всё расписание →
                </Link>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
                {upcomingSchedule.slice(0, 3).map(item => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.lesson_title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {item.course_title} · {item.group_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {new Date(item.scheduled_at).toLocaleString('ru-RU', {
                          weekday: 'short', day: 'numeric', month: 'short',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                      {item.zoom_url && (
                        <a href={item.zoom_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline">🔗 Zoom</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Аккаунт */}
      {tab === 'account' && (
        <div className="space-y-5">
          {/* Изменить имя */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Личные данные</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Полное имя</label>
                <input type="text" required value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input type="email" value={user?.email || ''} disabled
                  className={inputCls + ' opacity-50 cursor-not-allowed'} />
              </div>
              {saveOk && (
                <p className="text-sm text-green-600 dark:text-green-400">✓ Данные сохранены</p>
              )}
              <button type="submit" disabled={saving}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </form>
          </div>

          {/* Сменить пароль */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Сменить пароль</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Текущий пароль</label>
                <input type="password" required value={passwords.old_password}
                  onChange={e => setPasswords(p => ({ ...p, old_password: e.target.value }))}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Новый пароль</label>
                <input type="password" required minLength={8} value={passwords.new_password}
                  onChange={e => setPasswords(p => ({ ...p, new_password: e.target.value }))}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Повторите новый пароль</label>
                <input type="password" required value={passwords.new_password2}
                  onChange={e => setPasswords(p => ({ ...p, new_password2: e.target.value }))}
                  className={inputCls} />
              </div>
              {pwError && <p className="text-sm text-red-600 dark:text-red-400">{pwError}</p>}
              {pwOk && <p className="text-sm text-green-600 dark:text-green-400">✓ Пароль успешно изменён</p>}
              <button type="submit" disabled={pwSaving}
                className="px-5 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-50 transition-colors">
                {pwSaving ? 'Сохранение...' : 'Сменить пароль'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

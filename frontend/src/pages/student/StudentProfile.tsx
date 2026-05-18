import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/auth'
import api from '../../api/client'
import type { Course } from '../../types'

type Tab = 'overview' | 'settings'

export default function StudentProfile() {
  const { user, setUser } = useAuthStore()
  const [tab, setTab] = useState<Tab>('overview')

  // Overview
  const [courses, setCourses] = useState<Course[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)

  // Settings
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [passwords, setPasswords] = useState({ old_password: '', new_password: '', new_password2: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  useEffect(() => {
    api.get<Course[]>('/courses/my/')
      .then(res => setCourses(res.data))
      .finally(() => setCoursesLoading(false))
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveSuccess(false)
    try {
      const { data } = await api.patch('/users/me/', { full_name: fullName })
      setUser(data)
      setSaveSuccess(true)
    } finally { setSaving(false) }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)
    try {
      await authApi.changePassword(passwords)
      setPwSuccess(true)
      setPasswords({ old_password: '', new_password: '', new_password2: '' })
    } catch (err: any) {
      setPwError(err.response?.data?.detail || 'Ошибка смены пароля')
    }
  }

  const joinedDate = user?.date_joined
    ? new Date(user.date_joined).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const disabledCls = "w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Профиль</h1>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {([['overview', 'Обзор'], ['settings', 'Настройки']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === key
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* User card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold shrink-0 overflow-hidden">
              {user?.avatar
                ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                : initials
              }
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{user?.full_name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                  Студент
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">На платформе с {joinedDate}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-3xl font-bold text-blue-600">{coursesLoading ? '—' : courses.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Курсов записано</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-3xl font-bold text-green-600">
                {coursesLoading ? '—' : courses.filter(c => c.has_live_sessions).length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">С живыми занятиями</p>
            </div>
          </div>

          {/* Course list */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">Мои курсы</h2>
            {coursesLoading ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : courses.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Вы ещё не записаны на курсы</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {courses.map(course => (
                  <div key={course.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{course.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{course.teacher.full_name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {course.has_live_sessions && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">Онлайн</span>
                      )}
                      {course.is_free
                        ? <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">Бесплатно</span>
                        : <span className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full">${course.price}</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SETTINGS ── */}
      {tab === 'settings' && (
        <div className="space-y-5">
          {/* Personal info */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">Личные данные</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" disabled value={user?.email || ''} className={disabledCls} />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Email изменить нельзя</p>
              </div>
              <div>
                <label className={labelCls}>Полное имя</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className={inputCls}
                />
              </div>
              {saveSuccess && <p className="text-sm text-green-600 dark:text-green-400">Данные сохранены</p>}
              <button
                type="submit"
                disabled={saving || !fullName.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </form>
          </div>

          {/* Password */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">Смена пароля</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className={labelCls}>Текущий пароль</label>
                <input type="password" value={passwords.old_password}
                  onChange={e => setPasswords({ ...passwords, old_password: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Новый пароль</label>
                <input type="password" value={passwords.new_password}
                  onChange={e => setPasswords({ ...passwords, new_password: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Повторите новый пароль</label>
                <input type="password" value={passwords.new_password2}
                  onChange={e => setPasswords({ ...passwords, new_password2: e.target.value })}
                  className={inputCls} />
              </div>
              {pwError && <p className="text-sm text-red-600 dark:text-red-400">{pwError}</p>}
              {pwSuccess && <p className="text-sm text-green-600 dark:text-green-400">Пароль успешно изменён</p>}
              <button
                type="submit"
                disabled={!passwords.old_password || !passwords.new_password || !passwords.new_password2}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Изменить пароль
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

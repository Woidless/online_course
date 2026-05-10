import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { coursesApi } from '../../api/courses'
import type { Course, Schedule } from '../../types'
import api from '../../api/client'

export default function StudentDashboard() {
  const { user } = useAuthStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [schedule, setSchedule] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([coursesApi.my(), api.get<Schedule[]>('/schedule/')])
      .then(([c, s]) => { setCourses(c.data); setSchedule(s.data) })
      .catch(() => setError('Не удалось загрузить данные.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-12 text-center">
      <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
      <button onClick={() => window.location.reload()} className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
        Обновить страницу
      </button>
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
          Добро пожаловать, {user?.full_name?.split(' ')[0] || 'Студент'}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Ваш учебный кабинет</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Активных курсов', value: courses.length },
          { label: 'Занятий на этой неделе', value: schedule.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-4xl font-semibold text-gray-900 dark:text-gray-100 mt-2">{value}</p>
          </div>
        ))}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Ближайшее занятие</p>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-2">
            {schedule[0]?.scheduled_at
              ? new Date(schedule[0].scheduled_at).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
              : '—'}
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Мои курсы</h2>
          <Link to="/student/courses" className="text-sm text-blue-600 hover:underline font-medium">Все курсы →</Link>
        </div>
        {courses.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">Вы ещё не записаны ни на один курс</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.slice(0, 4).map(course => (
              <Link
                key={course.id}
                to={`/student/courses/${course.id}`}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all"
              >
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1">{course.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">{course.description}</p>
                <div className="text-xs text-gray-400 dark:text-gray-500">{course.lessons_count} уроков</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {schedule.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Ближайшие занятия</h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
            {schedule.slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
                  {item.course_title && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{item.course_title}</p>}
                </div>
                <div className="text-right">
                  {item.scheduled_at && (
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {new Date(item.scheduled_at).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  {item.zoom_url && (
                    <a href={item.zoom_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                      className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-blue-600 hover:underline">
                      🔗 Подключиться к Zoom
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
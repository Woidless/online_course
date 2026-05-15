import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { coursesApi } from '../../api/courses'
import type { Course, Schedule } from '../../types'
import api from '../../api/client'

export default function TeacherDashboard() {
  const { user } = useAuthStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [schedule, setSchedule] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      coursesApi.my(),
      api.get<Schedule[]>('/schedule/'),
    ]).then(([c, s]) => {
      setCourses(c.data)
      setSchedule(s.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
          Добро пожаловать, {user?.full_name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Кабинет преподавателя</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Моих курсов</p>
          <p className="text-4xl font-semibold text-gray-900 dark:text-gray-100 mt-2">{courses.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Занятий предстоит</p>
          <p className="text-4xl font-semibold text-gray-900 dark:text-gray-100 mt-2">{schedule.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Ближайшее занятие</p>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-2">
            {schedule[0]
              ? new Date(schedule[0].scheduled_at).toLocaleString('ru-RU', {
                  day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                })
              : '—'}
          </p>
        </div>
      </div>

      {/* Мои курсы */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Мои курсы</h2>
          <Link to="/teacher/courses" className="text-sm text-blue-600 hover:underline font-medium">
            Все курсы →
          </Link>
        </div>
        {courses.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">У вас пока нет курсов</p>
            <Link to="/teacher/courses/create"
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Создать первый курс
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.slice(0, 4).map(course => (
              <Link key={course.id} to={`/teacher/courses/${course.id}`}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{course.title}</h3>
                  <span className={`shrink-0 ml-2 text-xs px-2 py-0.5 rounded-full ${
                    course.is_published
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}>
                    {course.is_published ? 'Опубликован' : 'Черновик'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">{course.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                  <span>{course.lessons_count} уроков</span>
                  {course.is_free
                    ? <span className="text-green-600">Бесплатный</span>
                    : <span className="text-orange-500">${course.price}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Ближайшие занятия */}
      {schedule.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Ближайшие занятия</h2>
            <Link to="/teacher/schedule" className="text-sm text-blue-600 hover:underline font-medium">
              Всё расписание →
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
            {schedule.slice(0, 4).map(item => (
              <div key={item.id} className="flex items-center justify-between p-5">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{item.lesson_title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {item.course_title} · {item.group_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {new Date(item.scheduled_at).toLocaleString('ru-RU', {
                      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                  {item.zoom_url && (
                    <a href={item.zoom_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-1 block">
                      🔗 Zoom ссылка
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
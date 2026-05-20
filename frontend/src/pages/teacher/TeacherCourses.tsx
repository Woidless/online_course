import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { coursesApi } from '../../api/courses'
import type { Course } from '../../types'

export default function TeacherCourses() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    coursesApi.my().then(res => setCourses(res.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Мои курсы</h1>
        <Link to="/teacher/courses/create"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          + Создать курс
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">У вас пока нет курсов</p>
          <Link to="/teacher/courses/create"
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            Создать первый курс
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map(course => (
            <div key={course.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{course.title}</h3>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
                    course.is_published
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}>
                    {course.is_published ? 'Опубликован' : 'Черновик'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                  <span>{course.lessons_count} уроков</span>
                  {course.is_free
                    ? <span className="text-green-600">Бесплатный</span>
                    : <span className="text-orange-500">${course.price}</span>}
                  {course.has_live_sessions && <span className="text-blue-500">📹 Онлайн</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!course.is_published && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    Публикует администратор
                  </span>
                )}
                <button
                  onClick={() => navigate(`/teacher/courses/${course.id}`)}
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                  Открыть
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminApi } from '../../api/admin'
import type { Course } from '../../types'

export default function AdminCourses() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getCourses().then(res => setCourses(res.data)).finally(() => setLoading(false))
  }, [])

  const handlePublish = async (course: Course) => {
    try {
      if (course.is_published) {
        await adminApi.unpublishCourse(course.id)
      } else {
        await adminApi.publishCourse(course.id)
      }
      setCourses(prev => prev.map(c =>
        c.id === course.id ? { ...c, is_published: !c.is_published } : c
      ))
    } catch {
      alert('Не удалось изменить статус курса')
    }
  }

  const handleDelete = async (course: Course) => {
    if (!confirm(`Удалить курс "${course.title}"? Это действие нельзя отменить.`)) return
    try {
      await adminApi.deleteCourse(course.id)
      setCourses(prev => prev.filter(c => c.id !== course.id))
    } catch {
      alert('Не удалось удалить курс')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Курсы</h1>
        <Link to="/admin/courses/create"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          + Создать курс
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">Курсов пока нет</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Курс</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Преподаватель</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Статус</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Цена</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {courses.map(course => (
                <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{course.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{course.lessons_count} уроков</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {course.teacher.full_name}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      course.is_published
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}>
                      {course.is_published ? 'Опубликован' : 'Черновик'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {course.is_free
                      ? <span className="text-xs text-green-600">Бесплатно</span>
                      : <span className="text-xs font-medium text-gray-900 dark:text-gray-100">${course.price}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => handlePublish(course)}
                        className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                          course.is_published
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                            : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100'
                        }`}>
                        {course.is_published ? 'Снять' : 'Опубликовать'}
                      </button>
                      <button onClick={() => navigate(`/admin/courses/${course.id}`)}
                        className="px-3 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors">
                        Открыть
                      </button>
                      <button onClick={() => handleDelete(course)}
                        className="px-3 py-1 text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors">
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
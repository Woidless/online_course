import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { coursesApi } from '../../api/courses'
import { paymentsApi } from '../../api/payments'
import type { CourseCatalog } from '../../types'

export default function StudentCourseCatalog() {
  const navigate = useNavigate()
  const [catalog, setCatalog] = useState<CourseCatalog[]>([])
  const [enrolledIds, setEnrolledIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([
      coursesApi.catalog(),
      coursesApi.my(),
    ]).then(([cat, my]) => {
      setCatalog(cat.data)
      setEnrolledIds(new Set(my.data.map(c => c.id)))
    }).finally(() => setLoading(false))
  }, [])

  const handleFreeEnroll = async (course: CourseCatalog) => {
    const group = course.groups[0]
    if (!group) return alert('Нет доступных групп для записи.')
    setActionLoading(course.id)
    try {
      await coursesApi.selfEnroll(group.id)
      setEnrolledIds(prev => new Set([...prev, course.id]))
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка при записи')
    } finally {
      setActionLoading(null)
    }
  }

  const handlePaidEnroll = async (course: CourseCatalog) => {
    const group = course.groups[0]
    if (!group) return alert('Нет доступных групп для записи.')
    setActionLoading(course.id)
    try {
      const res = await paymentsApi.createCheckout(group.id)
      window.location.href = res.data.checkout_url
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка при создании сессии оплаты')
      setActionLoading(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Каталог курсов</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Все доступные курсы платформы</p>
      </div>

      {catalog.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">Пока нет доступных курсов</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {catalog.map(course => {
            const isEnrolled = enrolledIds.has(course.id)
            const hasGroup = course.groups.length > 0
            const busy = actionLoading === course.id

            return (
              <div key={course.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-3">
                {course.cover && (
                  <img src={course.cover} alt={course.title}
                    className="w-full h-36 object-cover rounded-lg" />
                )}

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{course.title}</h3>
                    {course.is_free ? (
                      <span className="shrink-0 text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium">
                        Бесплатно
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                        ${course.price}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                    <span>{course.lessons_count} уроков</span>
                    <span>·</span>
                    <span>{course.teacher.full_name}</span>
                    {course.has_live_sessions && (
                      <>
                        <span>·</span>
                        <span>Онлайн занятия</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-1">
                  {isEnrolled ? (
                    <button
                      onClick={() => navigate(`/student/courses/${course.id}`)}
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                      Перейти к курсу →
                    </button>
                  ) : !hasGroup ? (
                    <div className="text-center text-sm text-gray-400 dark:text-gray-500 py-2">
                      Набор закрыт
                    </div>
                  ) : course.is_free ? (
                    <button
                      onClick={() => handleFreeEnroll(course)}
                      disabled={busy}
                      className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                      {busy ? 'Запись...' : 'Записаться бесплатно'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePaidEnroll(course)}
                      disabled={busy}
                      className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                      {busy ? 'Переход к оплате...' : `Купить за $${course.price}`}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

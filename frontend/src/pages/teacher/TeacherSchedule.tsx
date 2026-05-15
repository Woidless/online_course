import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import type { Schedule } from '../../types'

export default function TeacherSchedule() {
  const [schedule, setSchedule] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Schedule[]>('/schedule/')
      .then(res => setSchedule(res.data))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить это занятие из расписания?')) return
    try {
      await api.delete(`/schedule/${id}/`)
      setSchedule(prev => prev.filter(s => s.id !== id))
    } catch {
      alert('Не удалось удалить занятие')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const grouped = schedule.reduce<Record<string, Schedule[]>>((acc, item) => {
    const date = new Date(item.scheduled_at).toLocaleDateString('ru-RU', {
      weekday: 'long', day: 'numeric', month: 'long'
    })
    if (!acc[date]) acc[date] = []
    acc[date].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Расписание занятий</h1>
        <Link to="/teacher/schedule/create"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          + Добавить занятие
        </Link>
      </div>

      {schedule.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-4xl mb-4">📅</p>
          <p className="text-gray-500 dark:text-gray-400">Расписание пустое</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                {date}
              </h2>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-5">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{item.lesson_title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {item.course_title} · {item.group_name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {new Date(item.scheduled_at).toLocaleTimeString('ru-RU', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.zoom_url && (
                        <a href={item.zoom_url} target="_blank" rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors">
                          🔗 Zoom
                        </a>
                      )}
                      <Link to={`/teacher/schedule/${item.id}/edit`}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        Изменить
                      </Link>
                      <button onClick={() => handleDelete(item.id)}
                        className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { coursesApi } from '../../api/courses'
import api from '../../api/client'
import type { CourseGroup, Lesson, Schedule } from '../../types'

export default function TeacherScheduleForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>() // id занятия при редактировании
  const isEdit = Boolean(id)

  const [groups, setGroups] = useState<CourseGroup[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedLesson, setSelectedLesson] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [zoomUrl, setZoomUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    // Загружаем все курсы учителя и их группы
    coursesApi.my().then(async coursesRes => {
      const allGroups: CourseGroup[] = []
      const allLessons: Lesson[] = []
      for (const course of coursesRes.data) {
        const [groupsRes, lessonsRes] = await Promise.all([
          coursesApi.getGroups(course.id),
          api.get<Lesson[]>(`/courses/${course.id}/lessons/`),
        ])
        allGroups.push(...groupsRes.data)
        allLessons.push(...lessonsRes.data)
      }
      setGroups(allGroups)
      setLessons(allLessons)
    }).finally(() => setInitialLoading(false))

    if (isEdit && id) {
      api.get<Schedule>(`/schedule/${id}/`).then(res => {
        setSelectedGroup(String(res.data.group))
        setSelectedLesson(String(res.data.lesson))
        setScheduledAt(res.data.scheduled_at.slice(0, 16))
        setZoomUrl(res.data.zoom_url || '')
      })
    }
  }, [id, isEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const payload = {
      group: Number(selectedGroup),
      lesson: Number(selectedLesson),
      scheduled_at: scheduledAt,
      zoom_url: zoomUrl || null,
    }
    try {
      if (isEdit) {
        await api.patch(`/schedule/${id}/`, payload)
      } else {
        await api.post('/schedule/', payload)
      }
      navigate('/teacher/schedule')
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка сохранения')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <button onClick={() => navigate('/teacher/schedule')}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 mb-3">
          ← Назад к расписанию
        </button>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Редактировать занятие' : 'Добавить занятие'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Группа
          </label>
          <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} required
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Выберите группу</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.course_title} — {g.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Урок
          </label>
          <select value={selectedLesson} onChange={e => setSelectedLesson(e.target.value)} required
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Выберите урок</option>
            {lessons.map(l => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Дата и время занятия
          </label>
          <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} required
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Zoom ссылка <span className="text-gray-400 font-normal">(необязательно)</span>
          </label>
          <input type="url" value={zoomUrl} onChange={e => setZoomUrl(e.target.value)}
            placeholder="https://zoom.us/j/..."
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Добавить'}
          </button>
          <button type="button" onClick={() => navigate('/teacher/schedule')}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}
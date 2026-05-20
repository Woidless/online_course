import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/client'

export default function TeacherCourseForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isFree, setIsFree] = useState(true)
  const [price, setPrice] = useState('')
  const [hasLiveSessions, setHasLiveSessions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit || !id) return
    api.get(`/courses/${id}/`).then(res => {
      const c = res.data
      setTitle(c.title)
      setDescription(c.description)
      setIsFree(c.is_free)
      setPrice(c.price || '')
      setHasLiveSessions(c.has_live_sessions)
    }).finally(() => setInitialLoading(false))
  }, [id, isEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const payload = {
      title,
      description,
      is_free: isFree,
      price: isFree ? null : price,
      has_live_sessions: hasLiveSessions,
    }
    try {
      if (isEdit) {
        await api.patch(`/courses/${id}/`, payload)
        navigate(`/teacher/courses/${id}`)
      } else {
        const formData = new FormData()
        Object.entries(payload).forEach(([k, v]) => {
          if (v !== null && v !== undefined) formData.append(k, String(v))
        })
        const res = await api.post('/courses/create/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        navigate(`/teacher/courses/${res.data.id}`)
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Ошибка сохранения')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

  if (initialLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <button onClick={() => navigate('/teacher/courses')}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 mb-3">
          ← Назад к курсам
        </button>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Редактировать курс' : 'Создать курс'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Название *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
            placeholder="Например: Python для начинающих"
            className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Описание *</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} required
            placeholder="Краткое описание курса..."
            className={`${inputCls} resize-none`} />
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isFree} onChange={e => setIsFree(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Бесплатный курс</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={hasLiveSessions} onChange={e => setHasLiveSessions(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Онлайн занятия (Zoom)</span>
          </label>
        </div>

        {!isFree && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Цена (USD) *</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)}
              min="0" step="0.01" required
              placeholder="49.99"
              className="w-40 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? 'Сохранение...' : isEdit ? 'Сохранить изменения' : 'Создать курс'}
          </button>
          <button type="button" onClick={() => navigate('/teacher/courses')}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}

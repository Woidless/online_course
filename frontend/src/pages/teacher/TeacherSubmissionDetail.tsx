import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/client'
import type { Submission } from '../../types'

const mediaPath = (url: string) => { try { return new URL(url).pathname } catch { return url } }

export default function TeacherSubmissionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState(false)

  useEffect(() => {
    if (!id) return
    api.get<Submission>(`/submissions/${id}/`)
      .then(res => {
        setSubmission(res.data)
        if (res.data.grade) {
          setFeedback(res.data.grade.feedback)
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setGrading(true)
    try {
      await api.post(`/submissions/${id}/grade/`, { feedback })
      navigate('/teacher/submissions')
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка при выставлении оценки')
    } finally {
      setGrading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!submission) return <div className="text-center py-12 text-gray-500">Работа не найдена</div>

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <button onClick={() => navigate('/teacher/submissions')}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 mb-3">
          ← Назад к работам
        </button>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Проверка работы</h1>
      </div>

      {/* Информация */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{submission.student_name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{submission.assignment_title}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            submission.status === 'graded'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
          }`}>
            {submission.status === 'graded' ? 'Проверено' : 'Ожидает проверки'}
          </span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Сдано: {new Date(submission.submitted_at).toLocaleString('ru-RU')}
        </p>
      </div>

      {/* Ответ студента */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Ответ студента</h2>
        {submission.content ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {submission.content}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">Текстовый ответ не предоставлен</p>
        )}
        {submission.file && (
          <a
            href={mediaPath(submission.file)}
            download
            className="inline-flex items-center gap-2 mt-3 text-sm text-blue-600 hover:underline">
            📎 Скачать файл
          </a>
        )}
      </div>

      {/* Форма оценки */}
      <form onSubmit={handleGrade}
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {submission.status === 'graded' ? 'Редактировать комментарий' : 'Оставить комментарий'}
        </h2>

        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Комментарий к работе</label>
          <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
            rows={4} placeholder="Оставьте комментарий к работе..."
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={grading}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {grading ? 'Сохранение...' : submission.status === 'graded' ? 'Обновить' : 'Принять работу'}
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await api.post(`/submissions/${id}/return/`)
                navigate('/teacher/submissions')
              } catch {
                alert('Ошибка')
              }
            }}
            className="px-6 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg border border-red-200 dark:border-red-700 hover:bg-red-100 transition-colors">
            Вернуть на доработку
          </button>
        </div>
      </form>
    </div>
  )
}

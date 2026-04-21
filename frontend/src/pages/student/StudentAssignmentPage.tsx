import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/client'
import type { Assignment, Submission } from '../../types'

export default function StudentAssignmentPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.get<Assignment>(`/assignments/${id}/`),
      api.get<Submission[]>('/submissions/my/'),
    ]).then(([assignmentRes, submissionsRes]) => {
      setAssignment(assignmentRes.data)
      const existing = submissionsRes.data.find(s => s.assignment === Number(id))
      if (existing) setSubmission(existing)
    }).finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setError('')
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('assignment', id)
      if (content) formData.append('content', content)
      if (file) formData.append('file', file)

      const { data } = await api.post<Submission>(
        `/assignments/${id}/submit/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      setSubmission(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при отправке задания')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!assignment) return (
    <div className="text-center py-12 text-gray-500">Задание не найдено</div>
  )

  const statusLabel = {
    submitted: { text: 'Сдано', color: 'bg-yellow-100 text-yellow-700' },
    graded: { text: 'Оценено', color: 'bg-green-100 text-green-700' },
    returned: { text: 'На доработке', color: 'bg-red-100 text-red-700' },
  }

  return (
    <div className="max-w-3xl space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        ← Назад
      </button>

      {/* Задание */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl font-semibold text-gray-900">{assignment.title}</h1>
          <span className="shrink-0 text-sm text-gray-500">{assignment.max_score} баллов</span>
        </div>

        {assignment.due_date && (
          <p className="text-sm text-gray-500 mb-4">
            Срок сдачи: {new Date(assignment.due_date).toLocaleDateString('ru-RU', {
              day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        )}

        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
          {assignment.description}
        </div>
      </div>

      {/* Результат если уже оценено */}
      {submission?.status === 'graded' && submission.grade && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <h2 className="text-base font-medium text-green-900 mb-2">Результат</h2>
          <p className="text-2xl font-semibold text-green-700">
            {submission.grade.score} / {assignment.max_score}
          </p>
          {submission.grade.feedback && (
            <p className="text-sm text-green-800 mt-2">{submission.grade.feedback}</p>
          )}
          <p className="text-xs text-green-600 mt-1">
            Проверил: {submission.grade.teacher_name}
          </p>
        </div>
      )}

      {/* Уже сдано */}
      {submission && submission.status !== 'graded' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-medium text-gray-900">Ваш ответ</h2>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusLabel[submission.status].color}`}>
              {statusLabel[submission.status].text}
            </span>
          </div>
          {submission.content && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.content}</p>
          )}
          {submission.file && (
            <a href={submission.file} target="_blank" rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline mt-2 block">
              Прикреплённый файл
            </a>
          )}
        </div>
      )}

      {/* Форма сдачи */}
      {!submission && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-medium text-gray-900 mb-4">Сдать задание</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Текстовый ответ
              </label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Введите ваш ответ..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Прикрепить файл (необязательно)
              </label>
              <input
                type="file"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || (!content && !file)}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Отправка...' : 'Сдать задание'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
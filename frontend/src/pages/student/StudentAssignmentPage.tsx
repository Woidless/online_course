import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/client'
import type { Assignment, Submission } from '../../types'

type SubmitMode = 'text' | 'file'

const mediaPath = (url: string) => { try { return new URL(url).pathname } catch { return url } }

const ALLOWED_EXTENSIONS = new Set([
  'pdf','doc','docx','odt','txt','rtf',
  'xls','xlsx','ods','csv',
  'ppt','pptx','odp',
  'jpg','jpeg','png','gif','webp',
  'zip','rar','7z','tar','gz',
  'py','js','ts','html','css','java','cpp','c','cs','rb','php','go',
  'ipynb','md',
])
const MAX_FILE_SIZE = 10 * 1024 * 1024

function validateFile(f: File): string | null {
  if (f.size > MAX_FILE_SIZE) return 'Файл слишком большой. Максимальный размер: 10 МБ.'
  const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_EXTENSIONS.has(ext)) return `Неподдерживаемый формат «.${ext}». Разрешены: PDF, DOC, DOCX, TXT, XLS, JPG, PNG, ZIP, PY, IPYNB и другие.`
  return null
}

export default function StudentAssignmentPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [mode, setMode] = useState<SubmitMode>('text')
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
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
      const existing = submissionsRes.data.find(s => String(s.assignment) === String(id))
      if (existing) {
        setSubmission(existing)
        if (existing.status === 'returned' && existing.content) {
          setContent(existing.content)
        }
      }
    }).catch(console.error).finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setError('')
    setSubmitting(true)
    try {
      let data: Submission
      if (mode === 'file' && file) {
        const form = new FormData()
        form.append('assignment', id)
        form.append('file', file)
        // Delete the JSON default so axios can set multipart/form-data + boundary
        const res = await api.post<Submission>(`/assignments/${id}/submit/`, form, {
          headers: { 'Content-Type': undefined },
        })
        data = res.data
      } else {
        const res = await api.post<Submission>(`/assignments/${id}/submit/`, {
          assignment: Number(id), content,
        })
        data = res.data
      }
      setSubmission(data)
    } catch (err: any) {
      const d = err.response?.data
      setError(typeof d === 'object' ? String(Object.values(d).flat().join(' ')) : 'Ошибка при отправке задания')
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
    <div className="text-center py-12 text-gray-500 dark:text-gray-400">Задание не найдено</div>
  )

  const statusLabel = {
    submitted: { text: 'Сдано', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
    graded: { text: 'Проверено', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
    returned: { text: 'На доработке', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  }

  return (
    <div className="max-w-3xl space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
      >
        ← Назад
      </button>

      {/* Задание */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{assignment.title}</h1>
        {assignment.due_date && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Срок сдачи: {new Date(assignment.due_date).toLocaleDateString('ru-RU', {
              day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        )}
        <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {assignment.description}
        </div>
        {assignment.lesson_colab_url && (
          <a
            href={assignment.lesson_colab_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none">
              <rect width="24" height="24" rx="4" fill="#F9AB00"/>
              <path d="M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0zm4-2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" fill="white"/>
            </svg>
            <span className="text-sm font-medium text-orange-900 dark:text-orange-200">Открыть в Google Colab</span>
            <svg className="w-3.5 h-3.5 text-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>

      {/* Результат если проверено */}
      {submission?.status === 'graded' && submission.grade && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
          <h2 className="text-base font-medium text-green-900 dark:text-green-300 mb-2">Результат проверки</h2>
          <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">✓ Принято</p>
          {submission.grade.feedback && (
            <p className="text-sm text-green-800 dark:text-green-300">{submission.grade.feedback}</p>
          )}
        </div>
      )}

      {/* Ожидает проверки */}
      {submission?.status === 'submitted' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-medium text-gray-900 dark:text-gray-100">Ваш ответ</h2>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusLabel.submitted.color}`}>
              {statusLabel.submitted.text}
            </span>
          </div>
          {submission.content && (
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{submission.content}</p>
          )}
          {submission.file && (
            <a href={mediaPath(submission.file)} download className="text-sm text-blue-600 hover:underline mt-2 block">
              📎 Скачать файл
            </a>
          )}
        </div>
      )}

      {/* На доработке — предыдущий ответ */}
      {submission?.status === 'returned' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
              На доработке
            </span>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300 mb-3">Преподаватель вернул работу на доработку. Исправьте и отправьте повторно.</p>
          {submission.content && (
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap border border-red-100 dark:border-red-800">
              {submission.content}
            </div>
          )}
          {submission.file && (
            <a href={mediaPath(submission.file)} download className="text-sm text-blue-600 hover:underline mt-2 block">
              📎 Предыдущий файл
            </a>
          )}
        </div>
      )}

      {/* Форма сдачи / переотправки */}
      {(!submission || submission.status === 'returned') && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">
            {submission?.status === 'returned' ? 'Переотправить задание' : 'Сдать задание'}
          </h2>

          {/* Переключатель режима */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit mb-4">
            {(['text', 'file'] as const).map(m => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  mode === m
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}>
                {m === 'text' ? 'Текст' : 'Файл'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'text' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Текстовый ответ
                </label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Введите ваш ответ..."
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Прикрепить файл
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                >
                  {file ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">📎 {file.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Нажмите, чтобы выбрать файл</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">PDF, DOCX, ZIP и другие</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept={Array.from(ALLOWED_EXTENSIONS).map(e => `.${e}`).join(',')}
                  onChange={e => {
                    const f = e.target.files?.[0] ?? null
                    if (f) {
                      const err = validateFile(f)
                      if (err) { setError(err); return }
                    }
                    setError('')
                    setFile(f)
                  }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || (mode === 'text' ? !content.trim() : !file)}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Отправка...' : submission?.status === 'returned' ? 'Переотправить' : 'Сдать задание'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

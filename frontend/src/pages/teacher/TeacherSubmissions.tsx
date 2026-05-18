import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import type { Submission } from '../../types'

export default function TeacherSubmissions() {
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'submitted' | 'graded'>('submitted')

  useEffect(() => {
    api.get<Submission[]>('/submissions/teacher/')
      .then(res => setSubmissions(res.data))
      .finally(() => setLoading(false))
  }, [])

  const filtered = submissions.filter(s => {
    if (filter === 'all') return true
    if (filter === 'submitted') return s.status === 'submitted'
    if (filter === 'graded') return s.status === 'graded'
    return true
  })

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Сданные работы</h1>

      <div className="flex gap-2">
        {([['submitted', 'Ожидают проверки'], ['graded', 'Проверено'], ['all', 'Все']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}>
            {label}
            {key === 'submitted' && submissions.filter(s => s.status === 'submitted').length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {submissions.filter(s => s.status === 'submitted').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {filter === 'submitted' ? 'Нет работ, ожидающих проверки' : 'Нет работ'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
          {filtered.map(submission => (
            <div key={submission.id}
              className="flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              onClick={() => navigate(`/teacher/submissions/${submission.id}`)}>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{submission.student_name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{submission.assignment_title}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Сдано: {new Date(submission.submitted_at).toLocaleString('ru-RU', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  submission.status === 'submitted'
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                    : submission.status === 'graded'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}>
                  {submission.status === 'submitted' ? 'Ожидает'
                    : submission.status === 'graded' ? 'Проверено'
                    : 'На доработке'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

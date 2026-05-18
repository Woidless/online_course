import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/client'

interface VerifyData {
  valid: boolean
  student_name: string
  course_title: string
  issued_at: string
}

export default function CertificateVerifyPage() {
  const { uid } = useParams<{ uid: string }>()
  const [data, setData] = useState<VerifyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!uid) return
    api.get<VerifyData>(`/certificates/verify/${uid}/`)
      .then(res => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [uid])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error || !data) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-200 dark:border-red-800 p-10 max-w-md w-full text-center shadow-lg">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Сертификат не найден</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Сертификат с данным кодом не существует или был отозван.
        </p>
      </div>
    </div>
  )

  const issuedDate = new Date(data.issued_at).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Valid badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-full text-sm font-medium border border-green-200 dark:border-green-700">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Сертификат действителен
          </span>
        </div>

        {/* Certificate card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-yellow-200 dark:border-yellow-700/50 shadow-xl overflow-hidden">
          {/* Top banner */}
          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 px-8 py-6 text-center">
            <p className="text-yellow-900/70 text-xs font-semibold uppercase tracking-widest mb-1">Сертификат об окончании</p>
            <h2 className="text-white text-2xl font-bold">Подтверждение</h2>
          </div>

          <div className="px-8 py-8 text-center space-y-5">
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Настоящим подтверждается, что</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{data.student_name}</p>
            </div>

            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">успешно завершил(а) курс</p>
              <p className="text-xl font-semibold text-amber-700 dark:text-amber-400">«{data.course_title}»</p>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Дата выдачи: <span className="font-medium text-gray-700 dark:text-gray-300">{issuedDate}</span></p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono break-all">{uid}</p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4">
          Этот сертификат был выдан образовательной платформой и может быть проверен по данной ссылке.
        </p>
      </div>
    </div>
  )
}

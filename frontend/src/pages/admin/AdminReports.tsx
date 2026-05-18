import api from '../../api/client'

export default function AdminReports() {
  const handleDownload = async () => {
    const res = await api.get('/quizzes/export/performance/', { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = 'quiz_performance.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Отчёты</h1>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">Успеваемость по тестам</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          CSV таблица с лучшим результатом каждого студента по каждому тесту. Если студент проходил тест несколько раз, сохраняется только лучшая оценка.
        </p>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Скачать CSV
        </button>
      </div>
    </div>
  )
}

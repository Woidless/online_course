import api from '../../api/client'

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}

async function downloadBlob(url: string, filename: string) {
  const res = await api.get(url, { responseType: 'blob' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([res.data]))
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

export default function AdminReports() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Отчёты</h1>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">Успеваемость по тестам</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Лучший результат каждого студента по каждому тесту. При повторном прохождении лучший балл сохраняется.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => downloadBlob('/quizzes/export/performance/', 'quiz_performance.csv')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-colors"
          >
            <DownloadIcon />
            Скачать CSV
          </button>
          <button
            onClick={() => downloadBlob('/quizzes/export/performance/excel/', 'quiz_performance.xlsx')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <DownloadIcon />
            Скачать Excel
          </button>
        </div>
      </div>
    </div>
  )
}

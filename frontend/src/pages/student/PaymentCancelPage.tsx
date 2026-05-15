import { Link } from 'react-router-dom'

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">✕</span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Оплата отменена</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Вы можете вернуться к курсу и попробовать снова в любое время.
        </p>
        <Link to="/student/courses"
          className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
          Вернуться к курсам
        </Link>
      </div>
    </div>
  )
}
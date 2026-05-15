import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { paymentsApi } from '../../api/payments'
import type { Payment } from '../../types'

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      paymentsApi.list()
        .then(res => {
          const paid = res.data.find(p =>
            p.stripe_checkout_session_id === sessionId || p.status === 'paid'
          )
          if (paid) setPayment(paid)
        })
        .finally(() => setLoading(false))
    }, 1500)
    return () => clearTimeout(timer)
  }, [sessionId])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Подтверждаем оплату...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">✓</span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Оплата прошла успешно!</h1>
        {payment && (
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Вы успешно записаны на курс <strong>{payment.course_title}</strong>
          </p>
        )}
        <Link to="/student/courses"
          className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
          Перейти к курсам
        </Link>
      </div>
    </div>
  )
}
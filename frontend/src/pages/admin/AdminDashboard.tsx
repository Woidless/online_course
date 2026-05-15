import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../api/admin'
import type { User, Course, Payment } from '../../types'

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminApi.getUsers(),
      adminApi.getCourses(),
      adminApi.getPayments(),
    ]).then(([u, c, p]) => {
      setUsers(u.data)
      setCourses(c.data)
      setPayments(p.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const students = users.filter(u => u.role === 'student')
  const teachers = users.filter(u => u.role === 'teacher')
  const paidPayments = payments.filter(p => p.status === 'paid')
  const totalRevenue = paidPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Панель администратора</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Общая статистика платформы</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Студентов', value: students.length, to: '/admin/users?role=student' },
          { label: 'Преподавателей', value: teachers.length, to: '/admin/users?role=teacher' },
          { label: 'Курсов', value: courses.length, to: '/admin/courses' },
          { label: 'Доход (USD)', value: `$${totalRevenue.toFixed(2)}`, to: '/admin/payments' },
        ].map(({ label, value, to }) => (
          <Link key={label} to={to}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mt-2">{value}</p>
          </Link>
        ))}
      </div>

      {/* Последние пользователи */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Новые пользователи</h2>
          <Link to="/admin/users" className="text-sm text-blue-600 hover:underline">Все →</Link>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
          {users.slice(0, 5).map(user => (
            <div key={user.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{user.full_name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  user.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : user.role === 'teacher' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}>
                  {user.role === 'admin' ? 'Админ' : user.role === 'teacher' ? 'Учитель' : 'Студент'}
                </span>
                {!user.is_active && (
                  <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                    Заблокирован
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Последние платежи */}
      {payments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Последние платежи</h2>
            <Link to="/admin/payments" className="text-sm text-blue-600 hover:underline">Все →</Link>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
            {payments.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{p.student_name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{p.course_title}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">${p.amount}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    p.status === 'paid' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : p.status === 'pending' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}>
                    {p.status_display}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
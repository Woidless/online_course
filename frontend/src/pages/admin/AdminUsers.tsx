import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { adminApi } from '../../api/admin'
import type { User } from '../../types'
import type { User, Role } from '../../types'

export default function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams()
  const roleFilter = searchParams.get('role') || 'all'
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    adminApi.getUsers(roleFilter !== 'all' ? roleFilter : undefined)
      .then(res => setUsers(res.data))
      .finally(() => setLoading(false))
  }, [roleFilter])

  const handleRoleChange = async (user: User, newRole: string) => {
    try {
      setActionLoading(user.id)
      await adminApi.updateUser(user.id, { role: newRole })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole as Role } : u))
    } catch {
      alert('Не удалось изменить роль')
    } finally {
      setActionLoading(null)
    }
  }

  const handleBlock = async (user: User) => {
    const action = user.is_active ? 'заблокировать' : 'разблокировать'
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} пользователя ${user.full_name}?`)) return
    try {
      setActionLoading(user.id)
      if (user.is_active) {
        await adminApi.blockUser(user.id)
      } else {
        await adminApi.unblockUser(user.id)
      }
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
    } catch {
      alert('Не удалось изменить статус')
    } finally {
      setActionLoading(null)
    }
  }

  const tabs = [
    { key: 'all', label: 'Все' },
    { key: 'student', label: 'Студенты' },
    { key: 'teacher', label: 'Преподаватели' },
    { key: 'admin', label: 'Админы' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Пользователи</h1>

      {/* Фильтры */}
      <div className="flex gap-2">
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setSearchParams(key !== 'all' ? { role: key } : {})}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              roleFilter === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">Пользователи не найдены</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Пользователь</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Роль</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Статус</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Дата регистрации</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{user.full_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select value={user.role}
                      onChange={e => handleRoleChange(user, e.target.value)}
                      disabled={actionLoading === user.id}
                      className="text-xs px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="student">Студент</option>
                      <option value="teacher">Преподаватель</option>
                      <option value="admin">Администратор</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      user.is_active
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    }`}>
                      {user.is_active ? 'Активен' : 'Заблокирован'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                    {new Date(user.date_joined).toLocaleDateString('ru-RU', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleBlock(user)}
                      disabled={actionLoading === user.id}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                        user.is_active
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'
                          : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40'
                      }`}>
                      {user.is_active ? 'Заблокировать' : 'Разблокировать'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
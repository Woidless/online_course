import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { adminApi } from '../../api/admin'
import { useAuthStore } from '../../store/authStore'
import type { User, Role } from '../../types'

interface CreateForm {
  email: string
  full_name: string
  password: string
  role: Role
}

interface EditForm {
  full_name: string
  email: string
}

const inputCls = "w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
const roleLabels: Record<string, string> = { student: 'Студент', teacher: 'Преподаватель', admin: 'Администратор' }
const roleCls: Record<string, string> = {
  student: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  teacher: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
  admin: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
}

export default function AdminUsers() {
  const { user: me } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const roleFilter = searchParams.get('role') || 'all'

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 20

  // Search
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>({ email: '', full_name: '', password: '', role: 'student' })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')

  // Edit modal
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ full_name: '', email: '' })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [roleFilter, search])

  // Fetch users
  useEffect(() => {
    setLoading(true)
    adminApi.getUsers(roleFilter !== 'all' ? roleFilter : undefined, page, search || undefined)
      .then(res => {
        setUsers(res.data.results)
        setTotalCount(res.data.count)
      })
      .finally(() => setLoading(false))
  }, [roleFilter, page, search])

  // Debounce search input
  const handleSearchChange = (val: string) => {
    setSearchInput(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setSearch(val.trim()), 400)
  }

  const isProtected = (user: User) =>
    user.id === me?.id || (user.is_superuser && !me?.is_superuser)

  const handleBlock = async (user: User) => {
    const action = user.is_active ? 'заблокировать' : 'разблокировать'
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} пользователя ${user.full_name}?`)) return
    try {
      setActionLoading(user.id)
      user.is_active ? await adminApi.blockUser(user.id) : await adminApi.unblockUser(user.id)
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Не удалось изменить статус')
    } finally {
      setActionLoading(null)
    }
  }

  const openEdit = (user: User) => {
    setEditUser(user)
    setEditForm({ full_name: user.full_name, email: user.email })
    setEditError('')
  }

  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editUser) return
    setEditError('')
    setEditLoading(true)
    try {
      const res = await adminApi.updateUser(editUser.id, {
        full_name: editForm.full_name,
        email: editForm.email,
      })
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...res.data } : u))
      setEditUser(null)
    } catch (err: any) {
      const d = err.response?.data
      setEditError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Ошибка сохранения')
    } finally {
      setEditLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCreateError('')
    setCreateLoading(true)
    try {
      const res = await adminApi.createUser(createForm)
      setUsers(prev => [res.data, ...prev])
      setTotalCount(prev => prev + 1)
      setShowCreate(false)
      setCreateForm({ email: '', full_name: '', password: '', role: 'student' })
    } catch (err: any) {
      const d = err.response?.data
      setCreateError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Не удалось создать пользователя')
    } finally {
      setCreateLoading(false)
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Пользователи</h1>
        <button
          onClick={() => { setShowCreate(true); setCreateError('') }}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          + Создать пользователя
        </button>
      </div>

      {/* Edit modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Редактировать пользователя
            </h2>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Полное имя *</label>
                <input type="text" required value={editForm.full_name}
                  onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                <input type="email" required value={editForm.email}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  className={inputCls} />
              </div>
              {editError && <p className="text-sm text-red-600 dark:text-red-400">{editError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={editLoading}
                  className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {editLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button type="button" onClick={() => setEditUser(null)}
                  className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Создать пользователя</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                <input type="email" required value={createForm.email}
                  onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  className={inputCls} placeholder="user@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Полное имя *</label>
                <input type="text" required value={createForm.full_name}
                  onChange={e => setCreateForm(f => ({ ...f, full_name: e.target.value }))}
                  className={inputCls} placeholder="Иванов Иван Иванович" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Пароль *</label>
                <input type="password" required minLength={6} value={createForm.password}
                  onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                  className={inputCls} placeholder="Минимум 6 символов" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Роль *</label>
                <select value={createForm.role}
                  onChange={e => setCreateForm(f => ({ ...f, role: e.target.value as Role }))}
                  className={inputCls}>
                  <option value="student">Студент</option>
                  <option value="teacher">Преподаватель</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
              {createError && <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={createLoading}
                  className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {createLoading ? 'Создание...' : 'Создать'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Поиск + фильтры */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Поиск по имени или email..."
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(''); setSearch('') }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              ✕
            </button>
          )}
        </div>
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
      </div>

      {search && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Поиск: <span className="font-medium text-gray-700 dark:text-gray-300">«{search}»</span>
          {!loading && ` — найдено ${totalCount}`}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {search ? `По запросу «${search}» ничего не найдено` : 'Пользователи не найдены'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Пользователь</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Роль</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Статус</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Регистрация</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map(user => {
                const locked = isProtected(user)
                const isSelf = user.id === me?.id
                return (
                  <tr key={user.id} className={`transition-colors ${locked ? 'opacity-60' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{user.full_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                        {isSelf && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded font-medium">Вы</span>
                        )}
                        {user.is_superuser && !isSelf && (
                          <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded font-medium">Суперюзер</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleCls[user.role] ?? ''}`}>
                        {roleLabels[user.role] ?? user.role}
                      </span>
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
                      <div className="flex items-center gap-2 justify-end">
                        {!locked && (
                          <>
                            <button onClick={() => openEdit(user)}
                              disabled={actionLoading === user.id}
                              className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                              Изменить
                            </button>
                            <button onClick={() => handleBlock(user)}
                              disabled={actionLoading === user.id}
                              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                                user.is_active
                                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'
                                  : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40'
                              }`}>
                              {user.is_active ? 'Заблокировать' : 'Разблокировать'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalCount > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Показано {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} из {totalCount}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Назад
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400">
              {page} / {Math.ceil(totalCount / pageSize)}
            </span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(totalCount / pageSize)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Вперёд
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

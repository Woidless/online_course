import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/auth'
import api from '../../api/client'

export default function StudentProfile() {
  const { user, setUser } = useAuthStore()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [passwords, setPasswords] = useState({
    old_password: '', new_password: '', new_password2: ''
  })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    try {
      const { data } = await api.patch('/users/me/', { full_name: fullName })
      setUser(data)
      setSuccess(true)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)
    try {
      await authApi.changePassword(passwords)
      setPwSuccess(true)
      setPasswords({ old_password: '', new_password: '', new_password2: '' })
    } catch (err: any) {
      setPwError(err.response?.data?.detail || 'Ошибка смены пароля')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900">Профиль</h1>

      {/* Основные данные */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-medium text-gray-900 mb-4">Личные данные</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              disabled
              value={user?.email}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Полное имя</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
            <input
              disabled
              value="Ученик"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
            />
          </div>
          {success && (
            <p className="text-sm text-green-600">Данные сохранены</p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>
      </div>

      {/* Смена пароля */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-medium text-gray-900 mb-4">Смена пароля</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Текущий пароль</label>
            <input
              type="password"
              value={passwords.old_password}
              onChange={e => setPasswords({ ...passwords, old_password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль</label>
            <input
              type="password"
              value={passwords.new_password}
              onChange={e => setPasswords({ ...passwords, new_password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Повторите пароль</label>
            <input
              type="password"
              value={passwords.new_password2}
              onChange={e => setPasswords({ ...passwords, new_password2: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {pwError && <p className="text-sm text-red-600">{pwError}</p>}
          {pwSuccess && <p className="text-sm text-green-600">Пароль изменён</p>}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            Изменить пароль
          </button>
        </form>
      </div>
    </div>
  )
}
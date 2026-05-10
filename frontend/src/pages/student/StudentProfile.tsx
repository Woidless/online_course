import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/auth'
import api from '../../api/client'

export default function StudentProfile() {
  const { user, setUser } = useAuthStore()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [passwords, setPasswords] = useState({ old_password: '', new_password: '', new_password2: '' })
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
    } finally { setSaving(false) }
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

  const inputClass = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const disabledClass = "w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Профиль</h1>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">Личные данные</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" disabled value={user?.email} className={disabledClass} />
          </div>
          <div>
            <label className={labelClass}>Полное имя</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Роль</label>
            <input disabled value="Ученик" className={disabledClass} />
          </div>
          {success && <p className="text-sm text-green-600 dark:text-green-400">Данные сохранены</p>}
          <button type="submit" disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">Смена пароля</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className={labelClass}>Текущий пароль</label>
            <input type="password" value={passwords.old_password}
              onChange={e => setPasswords({ ...passwords, old_password: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Новый пароль</label>
            <input type="password" value={passwords.new_password}
              onChange={e => setPasswords({ ...passwords, new_password: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Повторите пароль</label>
            <input type="password" value={passwords.new_password2}
              onChange={e => setPasswords({ ...passwords, new_password2: e.target.value })} className={inputClass} />
          </div>
          {pwError && <p className="text-sm text-red-600 dark:text-red-400">{pwError}</p>}
          {pwSuccess && <p className="text-sm text-green-600 dark:text-green-400">Пароль изменён</p>}
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            Изменить пароль
          </button>
        </form>
      </div>
    </div>
  )
}
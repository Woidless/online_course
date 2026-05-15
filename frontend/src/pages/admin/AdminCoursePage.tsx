import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { adminApi } from '../../api/admin'
import api from '../../api/client'
import type { Course, CourseGroup, Enrollment, User } from '../../types'

export default function AdminCoursePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [groups, setGroups] = useState<CourseGroup[]>([])
  const [activeGroup, setActiveGroup] = useState<CourseGroup | null>(null)
  const [students, setStudents] = useState<Enrollment[]>([])
  const [allStudents, setAllStudents] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'groups' | 'students'>('groups')
  const [showEnrollForm, setShowEnrollForm] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupTeacher, setGroupTeacher] = useState('')
  const [groupStarts, setGroupStarts] = useState('')
  const [teachers, setTeachers] = useState<User[]>([])
  const [creatingGroup, setCreatingGroup] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.get(`/courses/${id}/`),
      adminApi.getGroups(Number(id)),
      adminApi.getUsers('student'),
      adminApi.getUsers('teacher'),
    ]).then(([c, g, s, t]) => {
      setCourse(c.data)
      setGroups(g.data)
      setAllStudents(s.data)
      setTeachers(t.data)
      if (g.data.length > 0) setActiveGroup(g.data[0])
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!activeGroup) return
    adminApi.getEnrollments(activeGroup.id).then(res => setStudents(res.data))
  }, [activeGroup])

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeGroup || !selectedStudent) return
    setEnrolling(true)
    try {
      const res = await adminApi.enrollStudent(activeGroup.id, Number(selectedStudent))
      setStudents(prev => [...prev, res.data])
      setShowEnrollForm(false)
      setSelectedStudent('')
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка при записи студента')
    } finally {
      setEnrolling(false)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setCreatingGroup(true)
    try {
      const res = await adminApi.createGroup(Number(id), {
        name: groupName,
        teacher: Number(groupTeacher) || null,
        starts_at: groupStarts,
      } as any)
      setGroups(prev => [...prev, res.data])
      setActiveGroup(res.data)
      setShowGroupForm(false)
      setGroupName('')
      setGroupTeacher('')
      setGroupStarts('')
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка при создании группы')
    } finally {
      setCreatingGroup(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!course) return <div className="text-center py-12 text-gray-500">Курс не найден</div>

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <button onClick={() => navigate('/admin/courses')}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 flex items-center gap-1 mb-3">
          ← Назад к курсам
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{course.title}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{course.description}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Преподаватель: {course.teacher.full_name}
            </p>
          </div>
          <Link to={`/admin/courses/${id}/edit`}
            className="shrink-0 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
            Редактировать
          </Link>
        </div>
      </div>

      {/* Табы */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {([['groups', 'Группы'], ['students', 'Студенты']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === key
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Группы */}
      {tab === 'groups' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowGroupForm(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              + Создать группу
            </button>
          </div>

          {showGroupForm && (
            <form onSubmit={handleCreateGroup}
              className="bg-white dark:bg-gray-900 rounded-xl border border-blue-200 dark:border-blue-700 p-5 space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Новая группа</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Название группы</label>
                  <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)} required
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Дата начала</label>
                  <input type="date" value={groupStarts} onChange={e => setGroupStarts(e.target.value)} required
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Преподаватель</label>
                <select value={groupTeacher} onChange={e => setGroupTeacher(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Не назначен</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={creatingGroup}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {creatingGroup ? 'Создание...' : 'Создать'}
                </button>
                <button type="button" onClick={() => setShowGroupForm(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                  Отмена
                </button>
              </div>
            </form>
          )}

          {groups.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center">
              <p className="text-gray-500 dark:text-gray-400">Групп пока нет</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map(group => (
                <div key={group.id}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{group.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      Преподаватель: {group.teacher_name || 'Не назначен'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      Начало: {new Date(group.starts_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <button onClick={() => { setActiveGroup(group); setTab('students') }}
                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors">
                    Студенты →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Студенты группы */}
      {tab === 'students' && (
        <div className="space-y-4">
          {/* Выбор группы */}
          {groups.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Группа:</span>
              {groups.map(g => (
                <button key={g.id} onClick={() => setActiveGroup(g)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    activeGroup?.id === g.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}>
                  {g.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={() => setShowEnrollForm(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              + Добавить студента
            </button>
          </div>

          {showEnrollForm && (
            <form onSubmit={handleEnroll}
              className="bg-white dark:bg-gray-900 rounded-xl border border-blue-200 dark:border-blue-700 p-5 space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Записать студента в группу «{activeGroup?.name}»
              </h3>
              <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} required
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Выберите студента</option>
                {allStudents
                  .filter(s => !students.some(e => e.student === s.id))
                  .map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>)}
              </select>
              <div className="flex gap-2">
                <button type="submit" disabled={enrolling}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {enrolling ? 'Запись...' : 'Записать'}
                </button>
                <button type="button" onClick={() => setShowEnrollForm(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                  Отмена
                </button>
              </div>
            </form>
          )}

          {students.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center">
              <p className="text-gray-500 dark:text-gray-400">В группе пока нет студентов</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
              {students.map(enrollment => (
                <div key={enrollment.id} className="flex items-center justify-between p-4">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{enrollment.student_name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    enrollment.status === 'active'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}>
                    {enrollment.status === 'active' ? 'Активен' : enrollment.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
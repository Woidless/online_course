import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { adminApi } from '../../api/admin'
import api from '../../api/client'
import type { Course, CourseGroup, Enrollment, Lesson, User } from '../../types'

export default function AdminCoursePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [groups, setGroups] = useState<CourseGroup[]>([])
  const [activeGroup, setActiveGroup] = useState<CourseGroup | null>(null)
  const [students, setStudents] = useState<Enrollment[]>([])
  const [allStudents, setAllStudents] = useState<User[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'lessons' | 'groups' | 'students'>('lessons')

  // Enrollment form
  const [showEnrollForm, setShowEnrollForm] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState('')
  const [enrollTargetGroup, setEnrollTargetGroup] = useState('')
  const [enrolling, setEnrolling] = useState(false)

  // Group creation form
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupTeacher, setGroupTeacher] = useState('')
  const [groupStarts, setGroupStarts] = useState('')
  const [teachers, setTeachers] = useState<User[]>([])
  const [creatingGroup, setCreatingGroup] = useState(false)

  // Move student
  const [moveEnrollment, setMoveEnrollment] = useState<Enrollment | null>(null)
  const [moveTargetGroup, setMoveTargetGroup] = useState('')
  const [moving, setMoving] = useState(false)

  const [confirmDeleteLesson, setConfirmDeleteLesson] = useState<Lesson | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.get<Course>(`/courses/${id}/`),
      adminApi.getGroups(Number(id)),
      adminApi.getUsers('student'),
      adminApi.getUsers('teacher'),
      api.get<Lesson[]>(`/courses/${id}/lessons/`),
    ]).then(([c, g, s, t, l]) => {
      setCourse(c.data)
      setGroups(g.data)
      setAllStudents(s.data.results)
      setTeachers(t.data.results)
      setLessons(l.data)
      if (g.data.length > 0) {
        setActiveGroup(g.data[0])
        setEnrollTargetGroup(String(g.data[0].id))
      }
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!activeGroup) return
    adminApi.getEnrollments(activeGroup.id).then(res => setStudents(res.data))
  }, [activeGroup])

  const handleEnroll = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedStudent || !enrollTargetGroup) return
    setEnrolling(true)
    try {
      const res = await adminApi.enrollStudent(Number(enrollTargetGroup), Number(selectedStudent))
      if (Number(enrollTargetGroup) === activeGroup?.id) {
        setStudents(prev => [...prev, res.data])
      }
      setShowEnrollForm(false)
      setSelectedStudent('')
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка при записи студента')
    } finally {
      setEnrolling(false)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
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
      if (!activeGroup) {
        setActiveGroup(res.data)
        setEnrollTargetGroup(String(res.data.id))
      }
      setShowGroupForm(false)
      setGroupName('')
      setGroupTeacher('')
      setGroupStarts('')
    } catch (err: any) {
      alert(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Ошибка при создании группы')
    } finally {
      setCreatingGroup(false)
    }
  }

  const handleMoveStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!moveEnrollment || !moveTargetGroup) return
    setMoving(true)
    try {
      await adminApi.updateEnrollment(moveEnrollment.id, { group: Number(moveTargetGroup) })
      setStudents(prev => prev.filter(e => e.id !== moveEnrollment.id))
      if (Number(moveTargetGroup) === activeGroup?.id) {
        adminApi.getEnrollments(activeGroup.id).then(res => setStudents(res.data))
      }
      setMoveEnrollment(null)
      setMoveTargetGroup('')
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка при переносе студента')
    } finally {
      setMoving(false)
    }
  }

  const handleDeleteLesson = async () => {
    if (!confirmDeleteLesson) return
    await api.delete(`/lessons/${confirmDeleteLesson.id}/`)
    setLessons(prev => prev.filter(l => l.id !== confirmDeleteLesson.id))
    setConfirmDeleteLesson(null)
  }

  const inputCls = "w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!course) return <div className="text-center py-12 text-gray-500">Курс не найден</div>

  const sortedLessons = [...lessons].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Move student modal */}
      {moveEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Перенести студента</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {moveEnrollment.student_name} → выберите новую группу
            </p>
            <form onSubmit={handleMoveStudent} className="space-y-4">
              <select value={moveTargetGroup} onChange={e => setMoveTargetGroup(e.target.value)} required className={inputCls}>
                <option value="">Выберите группу</option>
                {groups.filter(g => g.id !== activeGroup?.id).map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <div className="flex gap-3">
                <button type="submit" disabled={moving}
                  className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {moving ? 'Перенос...' : 'Перенести'}
                </button>
                <button type="button" onClick={() => { setMoveEnrollment(null); setMoveTargetGroup('') }}
                  className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm delete lesson modal */}
      {confirmDeleteLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Удалить урок?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              «{confirmDeleteLesson.title}» будет удалён без возможности восстановления.
            </p>
            <div className="flex gap-3">
              <button onClick={handleDeleteLesson}
                className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
                Удалить
              </button>
              <button onClick={() => setConfirmDeleteLesson(null)}
                className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <button onClick={() => navigate('/admin/courses')}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 flex items-center gap-1 mb-3">
          ← Назад к курсам
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{course.title}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{course.description}</p>
            {course.teacher && (
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Преподаватель: {course.teacher.full_name}
              </p>
            )}
          </div>
          <Link to={`/admin/courses/${id}/edit`}
            className="shrink-0 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
            Редактировать
          </Link>
        </div>
      </div>

      {/* Табы */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {([['lessons', 'Уроки'], ['groups', 'Группы'], ['students', 'Студенты']] as const).map(([key, label]) => (
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

      {/* Уроки */}
      {tab === 'lessons' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Link to={`/admin/courses/${id}/lessons/create`}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              + Добавить урок
            </Link>
          </div>
          {sortedLessons.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-3">Уроков пока нет</p>
              <Link to={`/admin/courses/${id}/lessons/create`}
                className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Добавить первый урок
              </Link>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
              {sortedLessons.map((lesson, idx) => (
                <div key={lesson.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-xs font-medium text-gray-500 shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{lesson.title}</p>
                    {lesson.description && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{lesson.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {lesson.youtube_url && <span className="text-xs text-red-500" title="Видео">▶</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      lesson.is_published
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                    }`}>
                      {lesson.is_published ? 'Опубл.' : 'Черновик'}
                    </span>
                    <Link to={`/admin/lessons/${lesson.id}/edit`}
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="Редактировать">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <Link to={`/admin/lessons/${lesson.id}/quizzes/create`}
                      className="p-1.5 text-gray-400 hover:text-purple-600 transition-colors" title="Создать тест">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </Link>
                    <button onClick={() => setConfirmDeleteLesson(lesson)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Удалить">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Дата начала</label>
                  <input type="date" value={groupStarts} onChange={e => setGroupStarts(e.target.value)} required
                    className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Преподаватель</label>
                <select value={groupTeacher} onChange={e => setGroupTeacher(e.target.value)} className={inputCls}>
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
          {groups.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
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
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Записать студента</h3>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Группа</label>
                <select value={enrollTargetGroup} onChange={e => setEnrollTargetGroup(e.target.value)} required className={inputCls}>
                  <option value="">Выберите группу</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Студент</label>
                <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} required className={inputCls}>
                  <option value="">Выберите студента</option>
                  {allStudents.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>)}
                </select>
              </div>
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

          {groups.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Сначала создайте группу во вкладке «Группы»
              </p>
            </div>
          ) : students.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center">
              <p className="text-gray-500 dark:text-gray-400">В группе пока нет студентов</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
              {students.map(enrollment => (
                <div key={enrollment.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{enrollment.student_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{enrollment.group_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      enrollment.status === 'active'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                    }`}>
                      {enrollment.status === 'active' ? 'Активен' : enrollment.status}
                    </span>
                    {groups.length > 1 && (
                      <button
                        onClick={() => { setMoveEnrollment(enrollment); setMoveTargetGroup('') }}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        Перенести →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

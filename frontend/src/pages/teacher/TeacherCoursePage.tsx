import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { coursesApi } from '../../api/courses'
import api from '../../api/client'
import type { Course, CourseGroup, Lesson, Enrollment, Schedule, Section, QuizResult, Quiz, User, PaginatedResponse } from '../../types'

export default function TeacherCoursePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const prefix = pathname.startsWith('/admin') ? '/admin' : '/teacher'
  const [course, setCourse] = useState<Course | null>(null)
  const [groups, setGroups] = useState<CourseGroup[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [activeGroup, setActiveGroup] = useState<CourseGroup | null>(null)
  const [students, setStudents] = useState<Enrollment[]>([])
  const [schedule, setSchedule] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'lessons' | 'students' | 'schedule' | 'results'>('lessons')
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [resultsLoading, setResultsLoading] = useState(false)
  const [resultsSearch, setResultsSearch] = useState('')
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [addingSection, setAddingSection] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(new Set())
  const [orderLoading, setOrderLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Lesson | null>(null)
  const [lessonQuizzes, setLessonQuizzes] = useState<Record<number, Quiz[]>>({})
  const [expandedQuizLessons, setExpandedQuizLessons] = useState<Set<number>>(new Set())
  const [confirmDeleteQuiz, setConfirmDeleteQuiz] = useState<Quiz | null>(null)

  // Group management
  const [showAddGroupForm, setShowAddGroupForm] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupStarts, setNewGroupStarts] = useState('')
  const [creatingGroup, setCreatingGroup] = useState(false)

  // Student enrollment modal
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [enrollTargetGroupId, setEnrollTargetGroupId] = useState<number | null>(null)
  const [studentSearch, setStudentSearch] = useState('')
  const [studentResults, setStudentResults] = useState<User[]>([])
  const [searchingStudents, setSearchingStudents] = useState(false)
  const [enrollingStudent, setEnrollingStudent] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      coursesApi.detail(Number(id)),
      api.get<Lesson[]>(`/courses/${id}/lessons/`),
      coursesApi.getGroups(Number(id)),
      coursesApi.getSections(Number(id)),
    ]).then(([courseRes, lessonsRes, groupsRes, sectionsRes]) => {
      setCourse(courseRes.data)
      setLessons(lessonsRes.data)
      setGroups(groupsRes.data)
      setSections(sectionsRes.data)
      if (groupsRes.data.length > 0) setActiveGroup(groupsRes.data[0])
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!activeGroup) return
    coursesApi.getStudents(activeGroup.id).then(res => setStudents(res.data))
    api.get<Schedule[]>('/schedule/').then(res =>
      setSchedule(res.data.filter(s => s.group === activeGroup.id))
    )
  }, [activeGroup])

  useEffect(() => {
    if (lessons.length === 0) return
    Promise.all(lessons.map(l => api.get<Quiz[]>(`/lessons/${l.id}/quizzes/`)))
      .then(responses => {
        const map: Record<number, Quiz[]> = {}
        responses.forEach((res, i) => { map[lessons[i].id] = res.data })
        setLessonQuizzes(map)
      })
  }, [lessons])

  useEffect(() => {
    if (tab !== 'results' || !id) return
    setResultsLoading(true)
    api.get<QuizResult[]>(`/courses/${id}/quiz-results/`)
      .then(res => setQuizResults(res.data))
      .finally(() => setResultsLoading(false))
  }, [tab, id])

  const toggleSection = (sectionId: number) => {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  const handleCreateSection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!id || !newSectionTitle.trim()) return
    try {
      const res = await coursesApi.createSection(Number(id), {
        title: newSectionTitle.trim(),
        order: sections.length,
      })
      setSections(prev => [...prev, res.data])
      setNewSectionTitle('')
      setAddingSection(false)
    } catch {
      alert('Не удалось создать раздел')
    }
  }

  const handleDeleteSection = async (sectionId: number) => {
    if (!confirm('Удалить раздел? Уроки останутся без раздела.')) return
    await coursesApi.deleteSection(sectionId)
    setSections(prev => prev.filter(s => s.id !== sectionId))
  }

  const handleDeleteLesson = (lesson: Lesson) => {
    setConfirmDelete(lesson)
  }

  const confirmDeleteLesson = async () => {
    if (!confirmDelete) return
    await api.delete(`/lessons/${confirmDelete.id}/`)
    setLessons(prev => prev.filter(l => l.id !== confirmDelete.id))
    setConfirmDelete(null)
  }

  const swapSectionOrder = async (sorted: Section[], i: number, j: number) => {
    setOrderLoading(true)
    const a = sorted[i], b = sorted[j]
    try {
      await Promise.all([
        coursesApi.updateSection(a.id, { order: b.order }),
        coursesApi.updateSection(b.id, { order: a.order }),
      ])
      setSections(prev => prev.map(s =>
        s.id === a.id ? { ...s, order: b.order } :
        s.id === b.id ? { ...s, order: a.order } : s
      ))
    } finally {
      setOrderLoading(false)
    }
  }

  const swapLessonOrder = async (sorted: Lesson[], i: number, j: number) => {
    setOrderLoading(true)
    const a = sorted[i], b = sorted[j]
    try {
      await Promise.all([
        api.patch(`/lessons/${a.id}/`, { order: b.order }),
        api.patch(`/lessons/${b.id}/`, { order: a.order }),
      ])
      setLessons(prev => prev.map(l =>
        l.id === a.id ? { ...l, order: b.order } :
        l.id === b.id ? { ...l, order: a.order } : l
      ))
    } finally {
      setOrderLoading(false)
    }
  }

  const handleToggleEnrollment = async (group: CourseGroup) => {
    try {
      const res = await coursesApi.updateGroup(group.id, { is_enrollment_open: !group.is_enrollment_open })
      setGroups(prev => prev.map(g => g.id === group.id ? { ...g, is_enrollment_open: res.data.is_enrollment_open } : g))
      if (activeGroup?.id === group.id) setActiveGroup(prev => prev ? { ...prev, is_enrollment_open: res.data.is_enrollment_open } : prev)
    } catch {
      alert('Не удалось изменить статус набора')
    }
  }

  const handleCreateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!id || !newGroupName.trim() || !newGroupStarts) return
    setCreatingGroup(true)
    try {
      const res = await coursesApi.createGroup(Number(id), {
        name: newGroupName.trim(),
        starts_at: newGroupStarts,
      })
      setGroups(prev => [...prev, res.data])
      if (!activeGroup) setActiveGroup(res.data)
      setNewGroupName('')
      setNewGroupStarts('')
      setShowAddGroupForm(false)
    } catch {
      alert('Не удалось создать группу')
    } finally {
      setCreatingGroup(false)
    }
  }

  const handleSearchStudents = async () => {
    if (!studentSearch.trim()) return
    setSearchingStudents(true)
    try {
      const res = await api.get<PaginatedResponse<User>>(`/users/?role=student&search=${encodeURIComponent(studentSearch)}`)
      setStudentResults(res.data.results)
    } catch {
      setStudentResults([])
    } finally {
      setSearchingStudents(false)
    }
  }

  const handleEnrollStudent = async (studentId: number) => {
    const groupId = enrollTargetGroupId ?? activeGroup?.id
    if (!groupId) return
    setEnrollingStudent(true)
    try {
      const res = await coursesApi.enroll(groupId, studentId)
      if (groupId === activeGroup?.id) setStudents(prev => [...prev, res.data])
      setShowEnrollModal(false)
      setStudentSearch('')
      setStudentResults([])
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка при записи студента')
    } finally {
      setEnrollingStudent(false)
    }
  }

  const toggleQuizPanel = (lessonId: number) => {
    setExpandedQuizLessons(prev => {
      const next = new Set(prev)
      if (next.has(lessonId)) next.delete(lessonId)
      else next.add(lessonId)
      return next
    })
  }

  const handleDeleteQuiz = async () => {
    if (!confirmDeleteQuiz) return
    await api.delete(`/quizzes/${confirmDeleteQuiz.id}/`)
    setLessonQuizzes(prev => ({
      ...prev,
      [confirmDeleteQuiz.lesson]: (prev[confirmDeleteQuiz.lesson] || []).filter(q => q.id !== confirmDeleteQuiz.id),
    }))
    setConfirmDeleteQuiz(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!course) return <div className="text-center py-12 text-gray-500">Курс не найден</div>

  const sortedSections = [...sections].sort((a, b) => a.order - b.order)

  const lessonsBySection: Record<number, Lesson[]> = {}
  const unsectionedLessons: Lesson[] = []
  for (const lesson of lessons) {
    if (lesson.section !== null) {
      if (!lessonsBySection[lesson.section]) lessonsBySection[lesson.section] = []
      lessonsBySection[lesson.section].push(lesson)
    } else {
      unsectionedLessons.push(lesson)
    }
  }
  for (const key in lessonsBySection) {
    lessonsBySection[key].sort((a, b) => a.order - b.order)
  }
  unsectionedLessons.sort((a, b) => a.order - b.order)

  const renderLessonCard = (lesson: Lesson, idx: number, group: Lesson[]) => {
    const quizzes = lessonQuizzes[lesson.id] || []
    const quizExpanded = expandedQuizLessons.has(lesson.id)
    return (
      <div key={lesson.id}>
        <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
          <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-xs font-medium text-gray-500 shrink-0">
            {idx + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{lesson.title}</p>
            {lesson.description && (
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{lesson.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {lesson.youtube_url && (
              <span className="text-xs text-red-500 font-medium" title="Видео">▶</span>
            )}
            {lesson.colab_url && (
              <span className="text-xs text-orange-400 font-medium" title="Colab">⬡</span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              lesson.is_published
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
            }`}>
              {lesson.is_published ? 'Опубл.' : 'Черновик'}
            </span>
            <div className="flex flex-col" title="Изменить порядок">
              <button
                onClick={() => swapLessonOrder(group, idx, idx - 1)}
                disabled={idx === 0 || orderLoading}
                className="leading-none text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed px-0.5">
                ▲
              </button>
              <button
                onClick={() => swapLessonOrder(group, idx, idx + 1)}
                disabled={idx === group.length - 1 || orderLoading}
                className="leading-none text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed px-0.5">
                ▼
              </button>
            </div>
            <Link
              to={`${prefix}/lessons/${lesson.id}/edit`}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Редактировать урок">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>
            <button
              onClick={() => toggleQuizPanel(lesson.id)}
              className={`flex items-center gap-1 p-1.5 rounded transition-colors ${
                quizExpanded
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
              }`}
              title="Тесты">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              {quizzes.length > 0 && (
                <span className="text-xs font-semibold">{quizzes.length}</span>
              )}
            </button>
            <button
              onClick={() => handleDeleteLesson(lesson)}
              className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              title="Удалить урок">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {quizExpanded && (
          <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 px-4 py-3 space-y-2">
            {quizzes.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500">Тестов пока нет</p>
            ) : (
              quizzes.map(quiz => (
                <div key={quiz.id} className="flex items-center gap-2 text-sm">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${quiz.is_published ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                  <span className="flex-1 truncate text-gray-800 dark:text-gray-200">{quiz.title}</span>
                  <span className="text-xs text-gray-400 shrink-0">{quiz.questions_count} вопр.</span>
                  <Link
                    to={`${prefix}/lessons/${lesson.id}/quizzes/${quiz.id}/edit`}
                    className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Редактировать тест">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => setConfirmDeleteQuiz(quiz)}
                    className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title="Удалить тест">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
            <Link
              to={`${prefix}/lessons/${lesson.id}/quizzes/create`}
              className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline mt-1">
              + Добавить тест
            </Link>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Enroll student modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md shadow-xl space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Добавить студента</h2>

            {groups.length > 1 && (
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Группа</label>
                <select
                  value={enrollTargetGroupId ?? ''}
                  onChange={e => setEnrollTargetGroupId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Поиск студента</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearchStudents()}
                  placeholder="Имя или email..."
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSearchStudents}
                  disabled={searchingStudents}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
                  {searchingStudents ? '...' : 'Найти'}
                </button>
              </div>
            </div>

            {studentResults.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                {studentResults.map(student => {
                  const alreadyEnrolled = students.some(e => e.student === student.id)
                  return (
                    <div key={student.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <div>
                        <p className="text-sm text-gray-900 dark:text-gray-100">{student.full_name}</p>
                        <p className="text-xs text-gray-400">{student.email}</p>
                      </div>
                      <button
                        onClick={() => handleEnrollStudent(student.id)}
                        disabled={alreadyEnrolled || enrollingStudent}
                        className="shrink-0 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        {alreadyEnrolled ? 'Уже записан' : 'Записать'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {studentResults.length === 0 && studentSearch && !searchingStudents && (
              <p className="text-sm text-gray-400 text-center py-2">Ничего не найдено</p>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowEnrollModal(false)
                  setStudentSearch('')
                  setStudentResults([])
                }}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete quiz modal */}
      {confirmDeleteQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Удалить тест?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              «{confirmDeleteQuiz.title}» и все результаты будут удалены без возможности восстановления.
            </p>
            <div className="flex gap-3">
              <button onClick={handleDeleteQuiz}
                className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
                Удалить
              </button>
              <button onClick={() => setConfirmDeleteQuiz(null)}
                className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Удалить урок?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              «{confirmDelete.title}» будет удалён без возможности восстановления.
            </p>
            <div className="flex gap-3">
              <button onClick={confirmDeleteLesson}
                className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
                Удалить
              </button>
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <button onClick={() => navigate(prefix === '/admin' ? '/admin/courses' : '/teacher/courses')}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 mb-3">
          ← Назад к курсам
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{course.title}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{course.description}</p>
          </div>
          <Link to={`${prefix}/courses/${id}/edit`}
            className="shrink-0 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            Редактировать
          </Link>
        </div>
      </div>

      {/* Groups section — always visible */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Группы</span>
          {!showAddGroupForm && (
            <button
              onClick={() => setShowAddGroupForm(true)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
              + Добавить группу
            </button>
          )}
        </div>

        {showAddGroupForm && (
          <form onSubmit={handleCreateGroup} className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 space-y-3 bg-blue-50/40 dark:bg-blue-900/10">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Название группы</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  required
                  placeholder="Группа А"
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Дата начала</label>
                <input
                  type="date"
                  value={newGroupStarts}
                  onChange={e => setNewGroupStarts(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={creatingGroup}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {creatingGroup ? 'Создание...' : 'Создать'}
              </button>
              <button type="button" onClick={() => { setShowAddGroupForm(false); setNewGroupName(''); setNewGroupStarts('') }}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Отмена
              </button>
            </div>
          </form>
        )}

        {groups.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">Групп пока нет — создайте первую группу</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {groups.map(g => (
              <div key={g.id} className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => setActiveGroup(g)}
                  className={`flex-1 text-left text-sm font-medium transition-colors ${
                    activeGroup?.id === g.id
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}>
                  {g.name}
                  {activeGroup?.id === g.id && (
                    <span className="ml-2 text-xs font-normal text-blue-400">● активна</span>
                  )}
                </button>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                  g.is_enrollment_open
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                }`}>
                  {g.is_enrollment_open ? 'Набор открыт' : 'Набор закрыт'}
                </span>
                <button
                  onClick={() => handleToggleEnrollment(g)}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    g.is_enrollment_open
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                  }`}>
                  {g.is_enrollment_open ? 'Закрыть набор' : 'Открыть набор'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {([['lessons', 'Уроки'], ['students', 'Студенты'], ['schedule', 'Расписание'], ['results', 'Результаты']] as const).map(([key, label]) => (
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
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Link to={`${prefix}/courses/${id}/lessons/create`}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              + Добавить урок
            </Link>
            {!addingSection && (
              <button
                onClick={() => setAddingSection(true)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                + Раздел
              </button>
            )}
          </div>

          {addingSection && (
            <form onSubmit={handleCreateSection}
              className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-xl border border-blue-200 dark:border-blue-700 p-3">
              <input
                type="text"
                value={newSectionTitle}
                onChange={e => setNewSectionTitle(e.target.value)}
                placeholder="Название раздела..."
                autoFocus
                className="flex-1 px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit"
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700">
                Создать
              </button>
              <button type="button" onClick={() => setAddingSection(false)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-lg">
                Отмена
              </button>
            </form>
          )}

          {sortedSections.map((section, sIdx) => {
            const sectionLessons = lessonsBySection[section.id] || []
            const isCollapsed = collapsedSections.has(section.id)
            return (
              <div key={section.id} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800">
                  <div className="flex flex-col shrink-0">
                    <button
                      onClick={() => swapSectionOrder(sortedSections, sIdx, sIdx - 1)}
                      disabled={sIdx === 0 || orderLoading}
                      className="leading-none text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed"
                      title="Переместить вверх">
                      ▲
                    </button>
                    <button
                      onClick={() => swapSectionOrder(sortedSections, sIdx, sIdx + 1)}
                      disabled={sIdx === sortedSections.length - 1 || orderLoading}
                      className="leading-none text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed"
                      title="Переместить вниз">
                      ▼
                    </button>
                  </div>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="flex items-center gap-2 flex-1 text-left min-w-0">
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${isCollapsed ? '-rotate-90' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{section.title}</span>
                    <span className="text-xs text-gray-400 shrink-0">{sectionLessons.length} ур.</span>
                  </button>
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    className="shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Удалить раздел">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {!isCollapsed && (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {sectionLessons.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
                        Нет уроков — назначьте уроки этому разделу через редактирование урока
                      </p>
                    ) : (
                      sectionLessons.map((lesson, i) => renderLessonCard(lesson, i, sectionLessons))
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {unsectionedLessons.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {sortedSections.length > 0 && (
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Без раздела</span>
                </div>
              )}
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {unsectionedLessons.map((lesson, i) => renderLessonCard(lesson, i, unsectionedLessons))}
              </div>
            </div>
          )}

          {lessons.length === 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-3">Уроков пока нет</p>
              <Link to={`${prefix}/courses/${id}/lessons/create`}
                className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Добавить первый урок
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Студенты */}
      {tab === 'students' && (
        <div className="space-y-3">
          {groups.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500 dark:text-gray-400">Группа:</span>
              {groups.map(g => (
                <button key={g.id} onClick={() => setActiveGroup(g)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    activeGroup?.id === g.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}>
                  {g.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            {groups.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">Сначала создайте группу</p>
            ) : (
              <button
                onClick={() => {
                  setEnrollTargetGroupId(activeGroup?.id ?? null)
                  setShowEnrollModal(true)
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                + Добавить студента
              </button>
            )}
          </div>
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

      {/* Результаты тестов */}
      {tab === 'results' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
            </svg>
            <input
              type="text"
              placeholder="Поиск по студенту или тесту..."
              value={resultsSearch}
              onChange={e => setResultsSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {resultsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (() => {
            const q = resultsSearch.trim().toLowerCase()
            const filtered = q
              ? quizResults.filter(r =>
                  r.student_name.toLowerCase().includes(q) ||
                  r.email.toLowerCase().includes(q) ||
                  r.quiz_title.toLowerCase().includes(q)
                )
              : quizResults
            return filtered.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  {quizResults.length === 0 ? 'Студенты ещё не сдавали тесты' : 'Ничего не найдено'}
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Студент</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Тест</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Результат</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Статус</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Попыток</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Дата</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filtered.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{r.student_name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{r.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-900 dark:text-gray-100">{r.quiz_title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{r.lesson_title}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-semibold ${
                            r.best_score >= r.passing_score
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-500 dark:text-red-400'
                          }`}>
                            {r.best_score.toFixed(0)}%
                          </span>
                          <p className="text-xs text-gray-400 mt-0.5">мин. {r.passing_score}%</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {r.passed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                              ✓ Пройден
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                              ✗ Не пройден
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                          {r.attempt_count}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-gray-400">
                          {r.last_attempt ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })()}
        </div>
      )}

      {/* Расписание */}
      {tab === 'schedule' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Link to={`${prefix}/groups/${activeGroup?.id}/schedule/create`}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              + Добавить занятие
            </Link>
          </div>
          {schedule.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center">
              <p className="text-gray-500 dark:text-gray-400">Расписание пустое</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
              {schedule.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{item.lesson_title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(item.scheduled_at).toLocaleString('ru-RU', {
                        weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.zoom_url && (
                      <a href={item.zoom_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline">🔗 Zoom</a>
                    )}
                    <Link to={`${prefix}/schedule/${item.id}/edit`}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                      Изменить
                    </Link>
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

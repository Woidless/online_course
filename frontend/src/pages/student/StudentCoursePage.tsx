import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { coursesApi } from '../../api/courses'
import { paymentsApi } from '../../api/payments'
import api from '../../api/client'
import type { Certificate, Course, Lesson, CourseProgress, CourseGroup, Section } from '../../types'

function SectionBlock({
  section,
  globalIndex,
  onNavigate,
}: {
  section: Section
  globalIndex: number
  onNavigate: (lessonId: number) => void
}) {
  const [open, setOpen] = useState(false)
  const total = section.lessons.length
  const done = section.lessons.filter(l => l.is_completed).length

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{section.title}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{done}/{total} уроков</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {section.lessons.map((lesson, i) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              index={globalIndex + i}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function LessonRow({
  lesson,
  index,
  onNavigate,
}: {
  lesson: Lesson
  index: number
  onNavigate: (lessonId: number) => void
}) {
  return (
    <button
      onClick={() => onNavigate(lesson.id)}
      className="w-full bg-white dark:bg-gray-900 p-4 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors text-left flex items-center gap-4"
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
        lesson.is_completed
          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
      }`}>
        {lesson.is_completed ? '✓' : index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{lesson.title}</p>
        {lesson.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{lesson.description}</p>
        )}
      </div>
      {lesson.youtube_url && <span className="text-xs text-red-500 shrink-0">▶ Видео</span>}
    </button>
  )
}

export default function StudentCoursePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [unsectioned, setUnsectioned] = useState<Lesson[]>([])
  const [progress, setProgress] = useState<CourseProgress | null>(null)
  const [group, setGroup] = useState<CourseGroup | null>(null)
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [certLoading, setCertLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [payLoading, setPayLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    Promise.all([
      coursesApi.detail(Number(id)),
      coursesApi.getSections(Number(id)),
      api.get<Lesson[]>(`/courses/${id}/lessons/`),
      coursesApi.getGroups(Number(id)),
    ]).then(([courseRes, sectionsRes, lessonsRes, groupsRes]) => {
      setCourse(courseRes.data)
      setSections(sectionsRes.data)
      // Lessons not assigned to any section
      const sectionedIds = new Set(sectionsRes.data.flatMap(s => s.lessons.map(l => l.id)))
      setUnsectioned(lessonsRes.data.filter(l => !sectionedIds.has(l.id)))
      if (groupsRes.data.length > 0) setGroup(groupsRes.data[0])
    }).catch(err => {
      setError(`Ошибка ${err.response?.status}: ${JSON.stringify(err.response?.data)}`)
    }).finally(() => setLoading(false))

    coursesApi.progress(Number(id)).then(res => setProgress(res.data)).catch(() => {})

    api.get<Certificate[]>('/certificates/my/').then(res => {
      const cert = res.data.find(c => c.course === Number(id))
      if (cert) setCertificate(cert)
    }).catch(() => {})
  }, [id])

  const handlePay = async () => {
    if (!group) return
    setPayLoading(true)
    try {
      const res = await paymentsApi.createCheckout(group.id)
      window.location.href = res.data.checkout_url
    } catch {
      alert('Не удалось создать сессию оплаты. Попробуйте позже.')
    } finally {
      setPayLoading(false)
    }
  }

  // Extract /media/... path from absolute URL so the same-origin Vite proxy handles it
  const mediaPath = (url: string) => {
    try { return new URL(url).pathname } catch { return url }
  }

  const handleGetCertificate = async () => {
    if (!id) return
    setCertLoading(true)
    try {
      const res = await api.post<Certificate>('/certificates/issue/', { course_id: Number(id) })
      setCertificate(res.data)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Не удалось получить сертификат')
    } finally {
      setCertLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8">
      <p className="text-red-700 dark:text-red-400 font-medium">Ошибка загрузки</p>
      <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
      <button onClick={() => navigate('/student/courses')} className="mt-4 text-sm text-blue-600 hover:underline">
        ← Вернуться к курсам
      </button>
    </div>
  )

  if (!course) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Курс не найден</div>

  const allCompleted = progress && progress.total_lessons > 0 && progress.completed_lessons >= progress.total_lessons

  // Track running lesson index for numbering across sections
  let runningIndex = 0

  return (
    <div className="space-y-6 max-w-3xl">
      <button onClick={() => navigate('/student/courses')}
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-3 flex items-center gap-1">
        ← Назад к курсам
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{course.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{course.description}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-sm text-gray-400 dark:text-gray-500">
              Преподаватель: {course.teacher.full_name}
            </span>
            {course.has_live_sessions && (
              <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                Онлайн занятия
              </span>
            )}
            {course.is_free ? (
              <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                Бесплатно
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full">
                ${course.price}
              </span>
            )}
          </div>
        </div>
        {!course.is_free && group && !course.is_enrolled && (
          <button onClick={handlePay} disabled={payLoading}
            className="shrink-0 px-5 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors">
            {payLoading ? 'Загрузка...' : `Оплатить $${course.price}`}
          </button>
        )}
      </div>

      {progress && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Прогресс курса</span>
            <span className="text-sm font-semibold text-blue-600">{progress.progress_percent}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress.progress_percent}%` }} />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {progress.completed_lessons} из {progress.total_lessons} уроков пройдено
          </p>
        </div>
      )}

      {allCompleted && (
        <div className="bg-linear-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-yellow-900 dark:text-yellow-200">Курс завершён!</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-0.5">
              {certificate ? 'Ваш сертификат готов' : 'Вы можете получить сертификат об окончании'}
            </p>
          </div>
          {certificate ? (
            <div className="flex items-center gap-2 shrink-0">
              {certificate.pdf && (
                <a
                  href={mediaPath(certificate.pdf)}
                  download={`certificate_${certificate.uid.slice(0, 8).toUpperCase()}.pdf`}
                  className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors">
                  Скачать PDF
                </a>
              )}
              <a href={certificate.verify_url} target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 bg-white dark:bg-gray-800 text-yellow-700 dark:text-yellow-300 text-sm font-medium rounded-lg border border-yellow-300 dark:border-yellow-600 hover:bg-yellow-50 transition-colors">
                Верифицировать
              </a>
            </div>
          ) : (
            <button onClick={handleGetCertificate} disabled={certLoading}
              className="shrink-0 px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors">
              {certLoading ? 'Выдаём...' : 'Получить сертификат'}
            </button>
          )}
        </div>
      )}

      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Уроки курса</h2>
        <div className="space-y-3">
          {sections.map(section => {
            const startIdx = runningIndex
            runningIndex += section.lessons.length
            return (
              <SectionBlock
                key={section.id}
                section={section}
                globalIndex={startIdx}
                onNavigate={lessonId => navigate(`/student/lessons/${lessonId}`)}
              />
            )
          })}

          {unsectioned.length > 0 && (
            sections.length > 0 ? (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Дополнительные уроки</span>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {unsectioned.map((lesson, i) => (
                    <LessonRow
                      key={lesson.id}
                      lesson={lesson}
                      index={runningIndex + i}
                      onNavigate={lessonId => navigate(`/student/lessons/${lessonId}`)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {unsectioned.map((lesson, i) => (
                  <button key={lesson.id} onClick={() => navigate(`/student/lessons/${lesson.id}`)}
                    className="w-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all text-left flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
                      lesson.is_completed
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      {lesson.is_completed ? '✓' : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{lesson.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{lesson.description}</p>
                    </div>
                    {lesson.youtube_url && <span className="text-xs text-red-500 shrink-0">▶ Видео</span>}
                  </button>
                ))}
              </div>
            )
          )}

          {sections.length === 0 && unsectioned.length === 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center">
              <p className="text-gray-500 dark:text-gray-400">Уроков пока нет</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

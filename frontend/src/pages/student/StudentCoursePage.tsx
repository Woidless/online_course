import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { coursesApi } from '../../api/courses'
import api from '../../api/client'
import type { Course, Lesson, CourseProgress } from '../../types'

export default function StudentCoursePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [progress, setProgress] = useState<CourseProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    setLoading(true)
    setError(null)

    Promise.all([
      coursesApi.detail(Number(id)),
      api.get<Lesson[]>(`/courses/${id}/lessons/`),
    ]).then(([courseRes, lessonsRes]) => {
      setCourse(courseRes.data)
      setLessons(lessonsRes.data)
    }).catch(err => {
      setError(`Ошибка ${err.response?.status} на ${err.config?.url}: ${JSON.stringify(err.response?.data)}`)
    }).finally(() => setLoading(false))

    coursesApi.progress(Number(id))
      .then(res => setProgress(res.data))
      .catch(() => {})
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-8">
      <p className="text-red-700 font-medium">Ошибка загрузки</p>
      <p className="text-red-600 text-sm mt-1">{error}</p>
      <button
        onClick={() => navigate('/student/courses')}
        className="mt-4 text-sm text-blue-600 hover:underline"
      >
        ← Вернуться к курсам
      </button>
    </div>
  )

  if (!course) return (
    <div className="text-center py-12 text-gray-500">Курс не найден</div>
  )

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <button
          onClick={() => navigate('/student/courses')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-3 flex items-center gap-1"
        >
          ← Назад к курсам
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">{course.title}</h1>
        <p className="text-gray-500 mt-1">{course.description}</p>
        <p className="text-sm text-gray-400 mt-1">Преподаватель: {course.teacher.full_name}</p>
      </div>

      {progress && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Прогресс курса</span>
            <span className="text-sm font-semibold text-blue-600">{progress.progress_percent}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress.progress_percent}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {progress.completed_lessons} из {progress.total_lessons} уроков пройдено
          </p>
        </div>
      )}

      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-3">Уроки курса</h2>
        <div className="space-y-2">
          {lessons.map((lesson, index) => (
            <button
              key={lesson.id}
              onClick={() => navigate(`/student/lessons/${lesson.id}`)}
              className="w-full bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all text-left flex items-center gap-4"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
                lesson.is_completed
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {lesson.is_completed ? '✓' : index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{lesson.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{lesson.description}</p>
              </div>
              <div className="text-right shrink-0">
                {lesson.scheduled_at && (
                  <p className="text-xs text-gray-400">
                    {new Date(lesson.scheduled_at).toLocaleDateString('ru-RU', {
                      day: 'numeric', month: 'short'
                    })}
                  </p>
                )}
                {lesson.zoom_url && (
                  <span className="text-xs text-blue-500">Zoom</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
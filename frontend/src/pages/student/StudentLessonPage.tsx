import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/client'
import type { Lesson, Assignment, Quiz } from '../../types'

export default function StudentLessonPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.get<Lesson>(`/lessons/${id}/`),
      api.get<Assignment[]>(`/lessons/${id}/assignments/`),
      api.get<Quiz[]>(`/lessons/${id}/quizzes/`),
    ]).then(([lessonRes, assignmentsRes, quizzesRes]) => {
      setLesson(lessonRes.data)
      setAssignments(assignmentsRes.data)
      setQuizzes(quizzesRes.data)
      setCompleted(lessonRes.data.is_completed === true)
    }).finally(() => setLoading(false))
  }, [id])

  const handleComplete = async () => {
    if (!id || completed) return
    setCompleting(true)
    try {
      await api.post(`/lessons/${id}/complete/`)
      setCompleted(true)
      setLesson(prev => prev ? { ...prev, is_completed: true } : prev)
    } finally {
      setCompleting(false)
    }
  }

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!lesson) return (
    <div className="text-center py-12 text-gray-500">Урок не найден</div>
  )

  return (
    <div className="max-w-3xl space-y-6">
      {/* Навигация */}
      <button
        onClick={() => navigate(`/student/courses/${lesson.course}`)}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        ← Назад к курсу
      </button>

      {/* Заголовок */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{lesson.title}</h1>
          <p className="text-gray-500 mt-1">{lesson.description}</p>
        </div>
        {completed ? (
          <span className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-full">
            ✓ Пройден
          </span>
        ) : (
          <button
            onClick={handleComplete}
            disabled={completing}
            className="shrink-0 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {completing ? 'Сохранение...' : 'Отметить пройденным'}
          </button>
        )}
      </div>

      {/* Zoom занятие */}
      {lesson.zoom_url && lesson.scheduled_at && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">Живое занятие</p>
            <p className="text-xs text-blue-700 mt-0.5">
              {new Date(lesson.scheduled_at).toLocaleString('ru-RU', {
                weekday: 'long', day: 'numeric',
                month: 'long', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
          <a
            href={lesson.zoom_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Подключиться к Zoom
          </a>
        </div>
      )}

      {/* YouTube видео */}
      {lesson.youtube_url && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="aspect-video">
            {getYouTubeId(lesson.youtube_url) ? (
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeId(lesson.youtube_url)}`}
                className="w-full h-full"
                allowFullScreen
                title={lesson.title}
              />
            ) : (
              <a
                href={lesson.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-full bg-gray-50 text-blue-600 hover:underline"
              >
                Открыть видео →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Текстовый контент */}
      {lesson.content && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-medium text-gray-900 mb-4">Материал урока</h2>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {lesson.content}
          </div>
        </div>
      )}

      {/* Материалы */}
      {lesson.materials.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-medium text-gray-900 mb-3">Дополнительные материалы</h2>
          <div className="space-y-2">
            {lesson.materials.map(material => (
              <a
                key={material.id}
                href={material.url || material.file || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors"
              >
                <span className="text-lg">
                  {material.type === 'file' ? '📄' : material.type === 'presentation' ? '📊' : '🔗'}
                </span>
                <span className="text-sm text-gray-700">{material.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Задания */}
      {assignments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-medium text-gray-900 mb-3">Задания</h2>
          <div className="space-y-3">
            {assignments.map(assignment => (
              <button
                key={assignment.id}
                onClick={() => navigate(`/student/assignments/${assignment.id}`)}
                className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900 text-sm">{assignment.title}</p>
                  <span className="text-xs text-gray-400">{assignment.max_score} баллов</span>
                </div>
                {assignment.due_date && (
                  <p className="text-xs text-gray-500 mt-1">
                    Срок: {new Date(assignment.due_date).toLocaleDateString('ru-RU', {
                      day: 'numeric', month: 'long'
                    })}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Тесты */}
      {quizzes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-medium text-gray-900 mb-3">Тесты</h2>
          <div className="space-y-3">
            {quizzes.map(quiz => (
              <button
                key={quiz.id}
                onClick={() => navigate(`/student/quizzes/${quiz.id}`)}
                className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900 text-sm">{quiz.title}</p>
                  <span className="text-xs text-gray-400">
                    Проходной балл: {quiz.passing_score}%
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500">{quiz.questions_count} вопросов</span>
                  {quiz.time_limit && (
                    <span className="text-xs text-gray-500">{quiz.time_limit} мин</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
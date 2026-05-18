import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/client'
import type { Lesson, Assignment, Quiz, Schedule } from '../../types'
import { marked } from 'marked'

export default function StudentLessonPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [scheduleItem, setScheduleItem] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.get<Lesson>(`/lessons/${id}/`),
      api.get<Assignment[]>(`/lessons/${id}/assignments/`),
      api.get<Quiz[]>(`/lessons/${id}/quizzes/`),
      api.get<Schedule[]>('/schedule/'),
    ]).then(([lessonRes, assignmentsRes, quizzesRes, scheduleRes]) => {
      setLesson(lessonRes.data)
      setAssignments(assignmentsRes.data)
      setQuizzes(quizzesRes.data)
      setCompleted(lessonRes.data.is_completed === true)
      const match = scheduleRes.data.find(s => s.lesson === lessonRes.data.id)
      if (match) setScheduleItem(match)
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
    <div className="text-center py-12 text-gray-500 dark:text-gray-400">Урок не найден</div>
  )

  return (
    <div className="max-w-3xl space-y-6">
      <button onClick={() => navigate(`/student/courses/${lesson.course}`)}
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1">
        ← Назад к курсу
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{lesson.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{lesson.description}</p>
        </div>
        {completed ? (
          <span className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-full">
            ✓ Пройден
          </span>
        ) : (
          <button onClick={handleComplete} disabled={completing}
            className="shrink-0 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {completing ? 'Сохранение...' : 'Отметить пройденным'}
          </button>
        )}
      </div>

      {scheduleItem && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Живое занятие</p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
              {new Date(scheduleItem.scheduled_at).toLocaleString('ru-RU', {
                weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
              })}
            </p>
            {scheduleItem.teacher_name && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                Преподаватель: {scheduleItem.teacher_name}
              </p>
            )}
          </div>
          {scheduleItem.zoom_url && (
            <a href={scheduleItem.zoom_url} target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Подключиться к Zoom
            </a>
          )}
        </div>
      )}

      {lesson.colab_url && (
        <a href={lesson.colab_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl p-4 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
          <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none">
            <rect width="24" height="24" rx="4" fill="#F9AB00"/>
            <path d="M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0zm4-2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" fill="white"/>
          </svg>
          <div>
            <p className="text-sm font-medium text-orange-900 dark:text-orange-200">Открыть в Google Colab</p>
            <p className="text-xs text-orange-700 dark:text-orange-400 mt-0.5">Интерактивный ноутбук с заданиями</p>
          </div>
          <svg className="w-4 h-4 ml-auto text-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}

      {lesson.youtube_url && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="aspect-video">
            {getYouTubeId(lesson.youtube_url) ? (
              <iframe src={`https://www.youtube.com/embed/${getYouTubeId(lesson.youtube_url)}`}
                className="w-full h-full" allowFullScreen title={lesson.title} />
            ) : (
              <a href={lesson.youtube_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800 text-blue-600 hover:underline">
                Открыть видео →
              </a>
            )}
          </div>
        </div>
      )}

      {lesson.content && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">Материал урока</h2>
          <div className="prose max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: marked(lesson.content) as string }} />
        </div>
      )}

      {lesson.materials.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-3">Дополнительные материалы</h2>
          <div className="space-y-2">
            {lesson.materials.map(material => (
              <a key={material.id} href={material.url || material.file || '#'} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <span className="text-lg">
                  {material.type === 'file' ? '📄' : material.type === 'presentation' ? '📊' : '🔗'}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{material.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {assignments.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-3">Задания</h2>
          <div className="space-y-3">
            {assignments.map(assignment => (
              <button key={assignment.id} onClick={() => navigate(`/student/assignments/${assignment.id}`)}
                className="w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{assignment.title}</p>
                </div>
                {assignment.due_date && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Срок: {new Date(assignment.due_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {quizzes.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-3">Тесты</h2>
          <div className="space-y-3">
            {quizzes.map(quiz => (
              <button key={quiz.id} onClick={() => navigate(`/student/quizzes/${quiz.id}`)}
                className="w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{quiz.title}</p>
                  <span className="text-xs text-gray-400 dark:text-gray-500">Проходной балл: {quiz.passing_score}%</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{quiz.questions_count} вопросов</span>
                  {quiz.time_limit && <span className="text-xs text-gray-500 dark:text-gray-400">{quiz.time_limit} мин</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
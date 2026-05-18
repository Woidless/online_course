import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/client'
import type { Quiz, QuizAttempt } from '../../types'

export default function StudentQuizPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<QuizAttempt | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!id) return
    api.get<Quiz>(`/quizzes/${id}/`).then(res => setQuiz(res.data)).finally(() => setLoading(false))
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [id])

  const startTimer = (startedAt: string, limitMinutes: number) => {
    const deadline = new Date(startedAt).getTime() + limitMinutes * 60 * 1000
    const tick = () => {
      const left = Math.max(0, Math.floor((deadline - Date.now()) / 1000))
      setTimeLeft(left)
      if (left === 0) {
        clearInterval(timerRef.current!)
        handleAutoSubmit()
      }
    }
    tick()
    timerRef.current = setInterval(tick, 1000)
  }

  const handleStart = async () => {
    if (!id || !quiz) return
    const { data } = await api.post<QuizAttempt>(`/quizzes/${id}/start/`)
    setAttempt(data)
    setAnswers({})
    if (data.status === 'completed' || data.status === 'timed_out') {
      setResult(data)
      return
    }
    if (quiz.time_limit) startTimer(data.started_at, quiz.time_limit)
  }

  const handleRetry = async () => {
    setResult(null)
    setAttempt(null)
    setAnswers({})
    setTimeLeft(null)
    if (timerRef.current) clearInterval(timerRef.current)
    await handleStart()
  }

  const handleAnswer = (questionId: number, value: string, type: string, checked?: boolean) => {
    if (type === 'single') {
      setAnswers(prev => ({ ...prev, [questionId]: value }))
    } else if (type === 'multiple') {
      setAnswers(prev => {
        const current = (prev[questionId] as string[]) || []
        return {
          ...prev,
          [questionId]: checked
            ? [...current, value]
            : current.filter(a => a !== value),
        }
      })
    }
  }

  const doSubmit = async (currentAttempt: QuizAttempt) => {
    const { data } = await api.post<QuizAttempt>(`/attempts/${currentAttempt.id}/submit/`, { answers })
    if (timerRef.current) clearInterval(timerRef.current)
    setResult(data)
  }

  const handleSubmit = async () => {
    if (!attempt) return
    setSubmitting(true)
    try { await doSubmit(attempt) } finally { setSubmitting(false) }
  }

  const handleAutoSubmit = async () => {
    setAttempt(prev => {
      if (prev) doSubmit(prev).catch(() => {})
      return prev
    })
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!quiz) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Тест не найден</div>

  // Результат
  if (result) {
    const passed = result.score !== null && result.score >= quiz.passing_score
    const timedOut = result.status === 'timed_out'
    return (
      <div className="max-w-2xl space-y-6">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          ← Назад
        </button>
        <div className={`rounded-xl border p-8 text-center ${
          timedOut ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          : passed ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <p className="text-4xl mb-3">{timedOut ? '⏰' : passed ? '🎉' : '😔'}</p>
          <h2 className={`text-2xl font-semibold mb-2 ${
            timedOut ? 'text-yellow-800 dark:text-yellow-300'
            : passed ? 'text-green-900 dark:text-green-300'
            : 'text-red-900 dark:text-red-300'
          }`}>
            {timedOut ? 'Время вышло' : passed ? 'Тест пройден!' : 'Тест не пройден'}
          </h2>
          {result.score !== null && (
            <p className={`text-4xl font-bold mb-1 ${passed ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {result.score}%
            </p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">Проходной балл: {quiz.passing_score}%</p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <button onClick={handleRetry}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
              Пройти заново
            </button>
            <button onClick={() => navigate(-1)}
              className="px-5 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200">
              К уроку
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Начало теста
  if (!attempt) {
    return (
      <div className="max-w-2xl space-y-6">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          ← Назад
        </button>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{quiz.description}</p>
          )}
          <div className="flex items-center justify-center gap-6 my-6 text-sm text-gray-500 dark:text-gray-400">
            <span>{quiz.questions_count} вопросов</span>
            {quiz.time_limit && (
              <span className="flex items-center gap-1">
                <span>⏱</span> {quiz.time_limit} минут
              </span>
            )}
            <span>Проходной балл: {quiz.passing_score}%</span>
          </div>
          <button onClick={handleStart} className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">
            Начать тест
          </button>
        </div>
      </div>
    )
  }

  // Прохождение теста
  const onlyChoiceQuestions = quiz.questions.filter(q => q.type !== 'text')

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{quiz.title}</h1>
        {timeLeft !== null && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-mono font-semibold ${
            timeLeft < 60
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
          }`}>
            ⏱ {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {onlyChoiceQuestions.map((question, index) => (
        <div key={question.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="font-medium text-gray-900 dark:text-gray-100 mb-4">
            {index + 1}. {question.text}
          </p>
          <div className="space-y-2">
            {question.answers.map(answer => (
              <label key={answer.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors">
                <input
                  type={question.type === 'single' ? 'radio' : 'checkbox'}
                  name={`question-${question.id}`}
                  value={answer.id}
                  onChange={e => handleAnswer(question.id, String(answer.id), question.type, e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{answer.text}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <button onClick={handleSubmit} disabled={submitting}
        className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50">
        {submitting ? 'Отправка...' : 'Завершить тест'}
      </button>
    </div>
  )
}

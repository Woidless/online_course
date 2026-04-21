import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (!id) return
    api.get<Quiz>(`/quizzes/${id}/`)
      .then(res => setQuiz(res.data))
      .finally(() => setLoading(false))
  }, [id])

  const handleStart = async () => {
    if (!id) return
    const { data } = await api.post<QuizAttempt>(`/quizzes/${id}/start/`)
    setAttempt(data)
    if (data.status === 'completed') setResult(data)
  }

  const handleAnswer = (questionId: number, answerId: string, type: string, checked?: boolean) => {
    if (type === 'single' || type === 'text') {
      setAnswers(prev => ({ ...prev, [questionId]: answerId }))
    } else if (type === 'multiple') {
      setAnswers(prev => {
        const current = (prev[questionId] as string[]) || []
        if (checked) {
          return { ...prev, [questionId]: [...current, answerId] }
        } else {
          return { ...prev, [questionId]: current.filter(a => a !== answerId) }
        }
      })
    }
  }

  const handleSubmit = async () => {
    if (!attempt) return
    setSubmitting(true)
    try {
      const { data } = await api.post<QuizAttempt>(
        `/attempts/${attempt.id}/submit/`,
        { answers }
      )
      setResult(data)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!quiz) return <div className="text-center py-12 text-gray-500">Тест не найден</div>

  // Результат
  if (result) {
    const passed = result.score !== null && result.score >= quiz.passing_score
    return (
      <div className="max-w-2xl space-y-6">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700">
          ← Назад
        </button>
        <div className={`rounded-xl border p-8 text-center ${passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
            <span className="text-3xl">{passed ? '🎉' : '😔'}</span>
          </div>
          <h2 className={`text-2xl font-semibold mb-2 ${passed ? 'text-green-900' : 'text-red-900'}`}>
            {passed ? 'Тест пройден!' : 'Тест не пройден'}
          </h2>
          <p className={`text-4xl font-bold mb-2 ${passed ? 'text-green-700' : 'text-red-700'}`}>
            {result.score}%
          </p>
          <p className={`text-sm ${passed ? 'text-green-700' : 'text-red-700'}`}>
            Проходной балл: {quiz.passing_score}%
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            Вернуться к уроку
          </button>
        </div>
      </div>
    )
  }

  // Старт теста
  if (!attempt) {
    return (
      <div className="max-w-2xl space-y-6">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700">
          ← Назад
        </button>
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">{quiz.title}</h1>
          <div className="flex items-center justify-center gap-6 my-6 text-sm text-gray-500">
            <span>{quiz.questions_count} вопросов</span>
            {quiz.time_limit && <span>{quiz.time_limit} минут</span>}
            <span>Проходной балл: {quiz.passing_score}%</span>
          </div>
          <button
            onClick={handleStart}
            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Начать тест
          </button>
        </div>
      </div>
    )
  }

  // Прохождение теста
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">{quiz.title}</h1>

      {quiz.questions.map((question, index) => (
        <div key={question.id} className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="font-medium text-gray-900 mb-4">
            {index + 1}. {question.text}
          </p>

          {question.type === 'text' ? (
            <textarea
              rows={3}
              onChange={e => handleAnswer(question.id, e.target.value, 'text')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Введите ответ..."
            />
          ) : (
            <div className="space-y-2">
              {question.answers.map(answer => (
                <label
                  key={answer.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <input
                    type={question.type === 'single' ? 'radio' : 'checkbox'}
                    name={`question-${question.id}`}
                    value={answer.id}
                    onChange={e => handleAnswer(
                      question.id,
                      String(answer.id),
                      question.type,
                      e.target.checked
                    )}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{answer.text}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Отправка...' : 'Завершить тест'}
      </button>
    </div>
  )
}
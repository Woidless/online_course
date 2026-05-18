import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/client'
import type { Lesson } from '../../types'

interface AnswerDraft {
  text: string
  is_correct: boolean
}

interface QuestionDraft {
  localId: number
  text: string
  type: 'single' | 'multiple' | 'text'
  points: number
  answers: AnswerDraft[]
}

let nextLocalId = 1

function makeQuestion(): QuestionDraft {
  return {
    localId: nextLocalId++,
    text: '',
    type: 'single',
    points: 1,
    answers: [
      { text: '', is_correct: false },
      { text: '', is_correct: false },
    ],
  }
}

export default function TeacherQuizForm() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [timeLimit, setTimeLimit] = useState('')
  const [passingScore, setPassingScore] = useState('60')
  const [isPublished, setIsPublished] = useState(false)
  const [questions, setQuestions] = useState<QuestionDraft[]>([makeQuestion()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!lessonId) return
    api.get<Lesson>(`/lessons/${lessonId}/`).then(res => setLesson(res.data))
  }, [lessonId])

  const addQuestion = () => setQuestions(prev => [...prev, makeQuestion()])

  const removeQuestion = (localId: number) =>
    setQuestions(prev => prev.filter(q => q.localId !== localId))

  const updateQuestion = (localId: number, patch: Partial<QuestionDraft>) =>
    setQuestions(prev => prev.map(q => q.localId === localId ? { ...q, ...patch } : q))

  const addAnswer = (localId: number) =>
    setQuestions(prev => prev.map(q =>
      q.localId === localId
        ? { ...q, answers: [...q.answers, { text: '', is_correct: false }] }
        : q
    ))

  const removeAnswer = (localId: number, idx: number) =>
    setQuestions(prev => prev.map(q =>
      q.localId === localId
        ? { ...q, answers: q.answers.filter((_, i) => i !== idx) }
        : q
    ))

  const updateAnswer = (localId: number, idx: number, patch: Partial<AnswerDraft>) =>
    setQuestions(prev => prev.map(q =>
      q.localId === localId
        ? { ...q, answers: q.answers.map((a, i) => i === idx ? { ...a, ...patch } : a) }
        : q
    ))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lessonId) return
    setError('')
    setSaving(true)
    try {
      // 1. Create quiz
      const quizRes = await api.post(`/lessons/${lessonId}/quizzes/`, {
        title,
        description,
        time_limit: timeLimit ? Number(timeLimit) : null,
        passing_score: Number(passingScore),
        is_published: isPublished,
      })
      const quizId = quizRes.data.id

      // 2. Create questions and answers sequentially
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        const qRes = await api.post(`/quizzes/${quizId}/questions/`, {
          text: q.text,
          type: q.type,
          order: i,
          points: q.points,
        })
        if (q.type !== 'text') {
          await api.post(`/questions/${qRes.data.id}/answers/`, {
            answers: q.answers.filter(a => a.text.trim()),
          })
        }
      }

      navigate(`/teacher/courses/${lesson?.course}`)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: unknown } }
      const d = axiosErr.response?.data
      setError(typeof d === 'object' ? JSON.stringify(d) : 'Не удалось создать тест')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"

  return (
    <div className="max-w-3xl space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
      >
        ← Назад
      </button>

      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Создать тест</h1>
        {lesson && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Урок: {lesson.title}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-base font-medium text-gray-900 dark:text-gray-100">Основная информация</h2>
          <div>
            <label className={labelCls}>Название теста *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              className={inputCls} required placeholder="Например: Тест по теме «Введение в Python»" />
          </div>
          <div>
            <label className={labelCls}>Описание</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              className={inputCls} rows={2} placeholder="Краткое описание (необязательно)" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Ограничение времени (минуты)</label>
              <input type="number" min="1" value={timeLimit} onChange={e => setTimeLimit(e.target.value)}
                className={inputCls} placeholder="Нет ограничения" />
            </div>
            <div>
              <label className={labelCls}>Проходной балл (%)</label>
              <input type="number" min="1" max="100" value={passingScore}
                onChange={e => setPassingScore(e.target.value)}
                className={inputCls} required />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Опубликовать сразу</span>
          </label>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          <h2 className="text-base font-medium text-gray-900 dark:text-gray-100">
            Вопросы ({questions.length})
          </h2>

          {questions.map((q, qi) => (
            <div key={q.localId} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Вопрос {qi + 1}</span>
                {questions.length > 1 && (
                  <button type="button" onClick={() => removeQuestion(q.localId)}
                    className="text-xs text-red-500 hover:text-red-700">Удалить</button>
                )}
              </div>

              <div>
                <label className={labelCls}>Текст вопроса *</label>
                <input type="text" value={q.text} onChange={e => updateQuestion(q.localId, { text: e.target.value })}
                  className={inputCls} required placeholder="Введите вопрос..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Тип</label>
                  <select value={q.type}
                    onChange={e => updateQuestion(q.localId, { type: e.target.value as QuestionDraft['type'] })}
                    className={inputCls}>
                    <option value="single">Один вариант</option>
                    <option value="multiple">Несколько вариантов</option>
                    <option value="text">Текстовый ответ</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Баллы</label>
                  <input type="number" min="1" value={q.points}
                    onChange={e => updateQuestion(q.localId, { points: Number(e.target.value) })}
                    className={inputCls} />
                </div>
              </div>

              {q.type !== 'text' && (
                <div className="space-y-2">
                  <label className={labelCls}>
                    Варианты ответов
                    <span className="ml-1 font-normal text-gray-400">(отметьте правильные)</span>
                  </label>
                  {q.answers.map((a, ai) => (
                    <div key={ai} className="flex items-center gap-2">
                      <input
                        type={q.type === 'single' ? 'radio' : 'checkbox'}
                        checked={a.is_correct}
                        onChange={e => {
                          if (q.type === 'single') {
                            // For single: uncheck all others
                            setQuestions(prev => prev.map(pq =>
                              pq.localId === q.localId
                                ? { ...pq, answers: pq.answers.map((pa, pi) => ({ ...pa, is_correct: pi === ai })) }
                                : pq
                            ))
                          } else {
                            updateAnswer(q.localId, ai, { is_correct: e.target.checked })
                          }
                        }}
                        name={`q${q.localId}-correct`}
                        className="w-4 h-4 text-blue-600 shrink-0"
                      />
                      <input
                        type="text"
                        value={a.text}
                        onChange={e => updateAnswer(q.localId, ai, { text: e.target.value })}
                        className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Вариант ${ai + 1}`}
                      />
                      {q.answers.length > 2 && (
                        <button type="button" onClick={() => removeAnswer(q.localId, ai)}
                          className="text-xs text-red-400 hover:text-red-600 shrink-0">✕</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => addAnswer(q.localId)}
                    className="text-sm text-blue-600 hover:underline">
                    + Добавить вариант
                  </button>
                </div>
              )}

              {q.type === 'text' && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Текстовые ответы проверяются вручную преподавателем
                </p>
              )}
            </div>
          ))}

          <button type="button" onClick={addQuestion}
            className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-600 transition-colors">
            + Добавить вопрос
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <button type="submit" disabled={saving || !title.trim()}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {saving ? 'Создание...' : 'Создать тест'}
        </button>
      </form>
    </div>
  )
}

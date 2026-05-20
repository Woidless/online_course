import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import api from '../../api/client'
import { coursesApi } from '../../api/courses'
import type { Lesson, LessonMaterial, Section } from '../../types'

interface LessonForm {
  title: string
  description: string
  content: string
  youtube_url: string
  colab_url: string
  order: number
  section: number | ''
  is_published: boolean
}

interface MaterialDraft {
  title: string
  type: 'file' | 'presentation' | 'link'
  url: string
}

const inputCls = "w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

const typeIcon: Record<string, string> = { file: '📄', presentation: '📊', link: '🔗' }
const typeLabel: Record<string, string> = { file: 'Файл (PDF, DOC...)', presentation: 'Презентация', link: 'Ссылка' }

export default function TeacherLessonForm() {
  const { courseId, lessonId } = useParams<{ courseId?: string; lessonId?: string }>()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const prefix = pathname.startsWith('/admin') ? '/admin' : '/teacher'
  const isEdit = !!lessonId
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<LessonForm>({
    title: '', description: '', content: '',
    youtube_url: '', colab_url: '',
    order: 0, section: '', is_published: false,
  })
  const [sections, setSections] = useState<Section[]>([])
  const [materials, setMaterials] = useState<LessonMaterial[]>([])
  const [resolvedCourseId, setResolvedCourseId] = useState<number | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Material upload form
  const [matDraft, setMatDraft] = useState<MaterialDraft>({ title: '', type: 'file', url: '' })
  const [matFile, setMatFile] = useState<File | null>(null)
  const [matUploading, setMatUploading] = useState(false)
  const [matError, setMatError] = useState('')
  const [showMatForm, setShowMatForm] = useState(false)

  useEffect(() => {
    if (isEdit && lessonId) {
      api.get<Lesson>(`/lessons/${lessonId}/`)
        .then(res => {
          const l = res.data
          setForm({
            title: l.title,
            description: l.description || '',
            content: l.content || '',
            youtube_url: l.youtube_url || '',
            colab_url: l.colab_url || '',
            order: l.order,
            section: l.section ?? '',
            is_published: l.is_published,
          })
          setMaterials(l.materials || [])
          setResolvedCourseId(l.course)
          return coursesApi.getSections(l.course)
        })
        .then(res => setSections(res.data))
        .finally(() => setLoading(false))
    } else if (courseId) {
      const cId = Number(courseId)
      setResolvedCourseId(cId)
      coursesApi.getSections(cId).then(res => setSections(res.data))
    }
  }, [lessonId, courseId, isEdit])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    const payload = {
      title: form.title,
      description: form.description,
      content: form.content,
      youtube_url: form.youtube_url || null,
      colab_url: form.colab_url || null,
      order: form.order,
      section: form.section === '' ? null : Number(form.section),
      is_published: form.is_published,
    }
    try {
      if (isEdit) {
        await api.patch(`/lessons/${lessonId}/`, payload)
      } else {
        await api.post(`/courses/${courseId}/lessons/`, payload)
      }
      navigate(resolvedCourseId ? `${prefix}/courses/${resolvedCourseId}` : `${prefix}/courses`)
    } catch (err: any) {
      const d = err.response?.data
      setError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleAddMaterial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!lessonId) return
    setMatError('')
    setMatUploading(true)
    try {
      const fd = new FormData()
      fd.append('title', matDraft.title)
      fd.append('type', matDraft.type)
      if (matDraft.type === 'link') {
        fd.append('url', matDraft.url)
      } else if (matFile) {
        fd.append('file', matFile)
      } else {
        setMatError('Выберите файл')
        return
      }
      const res = await api.post<LessonMaterial>(`/lessons/${lessonId}/materials/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setMaterials(prev => [...prev, res.data])
      setMatDraft({ title: '', type: 'file', url: '' })
      setMatFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setShowMatForm(false)
    } catch (err: any) {
      const d = err.response?.data
      setMatError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Не удалось добавить материал')
    } finally {
      setMatUploading(false)
    }
  }

  const handleDeleteMaterial = async (id: number) => {
    await api.delete(`/materials/${id}/`)
    setMaterials(prev => prev.filter(m => m.id !== id))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <button onClick={() => navigate(-1)}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 mb-3">
          ← Назад
        </button>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Редактировать урок' : 'Новый урок'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название *</label>
          <input type="text" required value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className={inputCls} placeholder="Введение в Python" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Краткое описание</label>
          <textarea value={form.description} rows={2}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className={inputCls} placeholder="Что студент узнает из этого урока" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Содержание урока</label>
          <textarea value={form.content} rows={8}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            className={inputCls} placeholder="Текст урока (поддерживает Markdown)..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">YouTube URL</label>
            <input type="url" value={form.youtube_url}
              onChange={e => setForm(f => ({ ...f, youtube_url: e.target.value }))}
              className={inputCls} placeholder="https://youtube.com/watch?v=..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Google Colab URL</label>
            <input type="url" value={form.colab_url}
              onChange={e => setForm(f => ({ ...f, colab_url: e.target.value }))}
              className={inputCls} placeholder="https://colab.research.google.com/..." />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Порядок</label>
            <input type="number" min={0} value={form.order}
              onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))}
              className={inputCls} />
          </div>
          {sections.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Раздел</label>
              <select value={form.section}
                onChange={e => setForm(f => ({ ...f, section: e.target.value === '' ? '' : Number(e.target.value) }))}
                className={inputCls}>
                <option value="">— Без раздела —</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="is_published" checked={form.is_published}
            onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <label htmlFor="is_published" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Опубликован (виден студентам)
          </label>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={saving}
            className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? 'Сохранение...' : (isEdit ? 'Сохранить изменения' : 'Создать урок')}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            Отмена
          </button>
        </div>
      </form>

      {/* Materials — only in edit mode */}
      {isEdit && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Материалы урока</h2>
            {!showMatForm && (
              <button onClick={() => setShowMatForm(true)}
                className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                + Добавить
              </button>
            )}
          </div>

          {/* Existing materials */}
          {materials.length > 0 ? (
            <div className="space-y-2">
              {materials.map(m => (
                <div key={m.id}
                  className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-base shrink-0">{typeIcon[m.type] ?? '📎'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{m.title}</p>
                    <p className="text-xs text-gray-400 truncate">{typeLabel[m.type]}</p>
                  </div>
                  {(m.file || m.url) && (
                    <a href={m.file || m.url || '#'} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0">
                      Открыть
                    </a>
                  )}
                  <button onClick={() => handleDeleteMaterial(m.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    title="Удалить материал">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            !showMatForm && (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-3">
                Нет материалов — добавьте файлы или ссылки
              </p>
            )
          )}

          {/* Add material form */}
          {showMatForm && (
            <form onSubmit={handleAddMaterial}
              className="space-y-3 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название *</label>
                <input type="text" required value={matDraft.title}
                  onChange={e => setMatDraft(d => ({ ...d, title: e.target.value }))}
                  className={inputCls} placeholder="Конспект лекции, Слайды, Задание..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Тип *</label>
                <select value={matDraft.type}
                  onChange={e => setMatDraft(d => ({ ...d, type: e.target.value as MaterialDraft['type'], url: '' }))}
                  className={inputCls}>
                  <option value="file">📄 Файл (PDF, DOCX, XLSX...)</option>
                  <option value="presentation">📊 Презентация (PPT, PDF)</option>
                  <option value="link">🔗 Ссылка</option>
                </select>
              </div>

              {matDraft.type === 'link' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL *</label>
                  <input type="url" required value={matDraft.url}
                    onChange={e => setMatDraft(d => ({ ...d, url: e.target.value }))}
                    className={inputCls} placeholder="https://..." />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Файл * {matFile && <span className="text-blue-600 font-normal">— {matFile.name}</span>}
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={matDraft.type === 'presentation'
                      ? '.pdf,.ppt,.pptx,.key'
                      : '.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar'}
                    onChange={e => setMatFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 dark:file:bg-blue-900/30 dark:file:text-blue-400 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              )}

              {matError && <p className="text-sm text-red-600 dark:text-red-400">{matError}</p>}

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={matUploading}
                  className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {matUploading ? 'Загрузка...' : 'Загрузить'}
                </button>
                <button type="button" onClick={() => { setShowMatForm(false); setMatError('') }}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

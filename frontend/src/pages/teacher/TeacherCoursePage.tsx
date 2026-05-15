import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { coursesApi } from '../../api/courses'
import api from '../../api/client'
import type { Course, CourseGroup, Lesson, Enrollment, Schedule } from '../../types'

export default function TeacherCoursePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [groups, setGroups] = useState<CourseGroup[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [activeGroup, setActiveGroup] = useState<CourseGroup | null>(null)
  const [students, setStudents] = useState<Enrollment[]>([])
  const [schedule, setSchedule] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'lessons' | 'students' | 'schedule'>('lessons')

  useEffect(() => {
    if (!id) return
    Promise.all([
      coursesApi.detail(Number(id)),
      api.get<Lesson[]>(`/courses/${id}/lessons/`),
      coursesApi.getGroups(Number(id)),
    ]).then(([courseRes, lessonsRes, groupsRes]) => {
      setCourse(courseRes.data)
      setLessons(lessonsRes.data)
      setGroups(groupsRes.data)
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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!course) return <div className="text-center py-12 text-gray-500">Курс не найден</div>

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <button onClick={() => navigate('/teacher/courses')}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 mb-3">
          ← Назад к курсам
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{course.title}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{course.description}</p>
          </div>
          <Link to={`/teacher/courses/${id}/edit`}
            className="shrink-0 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            Редактировать
          </Link>
        </div>
      </div>

      {/* Выбор группы */}
      {groups.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Группа:</span>
          {groups.map(g => (
            <button key={g.id} onClick={() => setActiveGroup(g)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeGroup?.id === g.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}>
              {g.name}
            </button>
          ))}
          <Link to={`/teacher/courses/${id}/groups/create`}
            className="px-3 py-1.5 text-sm text-blue-600 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            + Группа
          </Link>
        </div>
      )}

      {/* Табы */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {([['lessons', 'Уроки'], ['students', 'Студенты'], ['schedule', 'Расписание']] as const).map(([key, label]) => (
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
            <Link to={`/teacher/courses/${id}/lessons/create`}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              + Добавить урок
            </Link>
          </div>
          {lessons.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center">
              <p className="text-gray-500 dark:text-gray-400">Уроков пока нет</p>
            </div>
          ) : (
            lessons.map((lesson, index) => (
              <div key={lesson.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400 shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{lesson.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{lesson.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {lesson.youtube_url && <span className="text-xs text-red-500">▶ Видео</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    lesson.is_published
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}>
                    {lesson.is_published ? 'Опубликован' : 'Черновик'}
                  </span>
                  <Link to={`/teacher/lessons/${lesson.id}/edit`}
                    className="text-xs text-blue-600 hover:underline">
                    Редактировать
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Студенты */}
      {tab === 'students' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Link to={`/teacher/groups/${activeGroup?.id}/enroll`}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              + Добавить студента
            </Link>
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

      {/* Расписание */}
      {tab === 'schedule' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Link to={`/teacher/groups/${activeGroup?.id}/schedule/create`}
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
                    <Link to={`/teacher/schedule/${item.id}/edit`}
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
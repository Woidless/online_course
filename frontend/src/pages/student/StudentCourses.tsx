import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { coursesApi } from '../../api/courses'
import type { Course } from '../../types'

export default function StudentCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    coursesApi.my()
      .then(res => setCourses(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Мои курсы</h1>

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Вы ещё не записаны ни на один курс</p>
          <p className="text-sm text-gray-400 mt-1">Обратитесь к администратору для записи</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {courses.map(course => (
            <Link
              key={course.id}
              to={`/student/courses/${course.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              {course.cover && (
                <img
                  src={course.cover}
                  alt={course.title}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
              )}
              <h3 className="font-medium text-gray-900">{course.title}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.description}</p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-gray-400">{course.lessons_count} уроков</span>
                <span className="text-xs text-gray-400">
                  {course.teacher.full_name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
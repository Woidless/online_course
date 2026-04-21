import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { coursesApi } from '../../api/courses';
import type { Course, Schedule } from '../../types';
import api from '../../api/client';

export default function StudentDashboard() {
  const { user } = useAuthStore();

  const [courses, setCourses] = useState<Course[]>([]);
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      coursesApi.my(),
      api.get<Schedule[]>('/schedule/'),
    ])
      .then(([coursesRes, scheduleRes]) => {
        setCourses(coursesRes.data);
        setSchedule(scheduleRes.data);
      })
      .catch((err) => {
        console.error('Ошибка загрузки дашборда:', err);
        setError('Не удалось загрузить данные. Попробуйте обновить страницу.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-12 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Обновить страницу
        </button>
      </div>
    );
  }

  const nextLesson = schedule[0];

  return (
    <div className="space-y-8">
      {/* Приветствие */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">
          Добро пожаловать, {user?.full_name?.split(' ')[0] || 'Студент'}!
        </h1>
        <p className="text-gray-500 mt-1">Ваш учебный кабинет</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Активных курсов</p>
          <p className="text-4xl font-semibold text-gray-900 mt-2">{courses.length}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Занятий на этой неделе</p>
          <p className="text-4xl font-semibold text-gray-900 mt-2">{schedule.length}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Ближайшее занятие</p>
          <p className="text-lg font-medium text-gray-900 mt-2">
            {nextLesson?.scheduled_at
              ? new Date(nextLesson.scheduled_at).toLocaleString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'}
          </p>
        </div>
      </div>

      {/* Мои курсы */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Мои курсы</h2>
          <Link
            to="/student/courses"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
          >
            Все курсы →
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Вы ещё не записаны ни на один курс</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.slice(0, 4).map((course) => (
              <Link
                key={course.id}
                to={`/student/courses/${course.id}`}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
              >
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                  {course.description}
                </p>
                <div className="text-xs text-gray-400">
                  {course.lessons_count} уроков
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Ближайшие занятия */}
      {schedule.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ближайшие занятия</h2>
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {schedule.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{item.title}</p>
                  {item.course_title && (
                    <p className="text-sm text-gray-500 mt-0.5">{item.course_title}</p>
                  )}
                </div>

                <div className="text-right">
                  {item.scheduled_at && (
                    <p className="text-sm font-medium text-gray-700">
                      {new Date(item.scheduled_at).toLocaleDateString('ru-RU', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}

                  {item.zoom_url && (
                    <a
                      href={item.zoom_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      🔗 Подключиться к Zoom
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';
import api from '../../api/client';
import type { Schedule } from '../../types';

export default function StudentSchedule() {
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Schedule[]>('/schedule/')
      .then((res) => {
        setSchedule(res.data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError('Не удалось загрузить расписание');
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
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Расписание</h1>

      {schedule.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Нет запланированных занятий</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {schedule.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.title}</p>
                {item.course_title && (
                  <p className="text-sm text-gray-500 mt-0.5">{item.course_title}</p>
                )}
              </div>

              <div className="text-right">
                {item.scheduled_at && (
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(item.scheduled_at).toLocaleString('ru-RU', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'long',
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
                    className="inline-flex items-center gap-1.5 mt-2 text-sm text-blue-600 hover:text-blue-700 hover:underline transition"
                  >
                    🔗 Подключиться к Zoom
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
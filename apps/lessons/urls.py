from django.urls import path
from .views import (
    LessonListCreateView,
    LessonDetailView,
    LessonMaterialCreateView,
    LessonMaterialDeleteView,
    MarkLessonCompleteView,
    MyCourseProgressView,
    ScheduleView,
)

urlpatterns = [
    # Расписание
    path('schedule/', ScheduleView.as_view(), name='schedule'),

    # Уроки
    path('courses/<int:course_id>/lessons/', LessonListCreateView.as_view(), name='lesson-list'),
    path('courses/<int:course_id>/progress/', MyCourseProgressView.as_view(), name='course-progress'),
    path('lessons/<int:pk>/', LessonDetailView.as_view(), name='lesson-detail'),
    path('lessons/<int:lesson_id>/complete/', MarkLessonCompleteView.as_view(), name='lesson-complete'),

    # Материалы
    path('lessons/<int:lesson_id>/materials/', LessonMaterialCreateView.as_view(), name='material-create'),
    path('materials/<int:pk>/', LessonMaterialDeleteView.as_view(), name='material-delete'),
]
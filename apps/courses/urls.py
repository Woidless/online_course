from django.urls import path
from .views import (
    CourseListView,
    CourseCreateView,
    CourseDetailView,
    CoursePublishView,
    CourseGroupListCreateView,
    CourseGroupDetailView,
    EnrollStudentView,
    GroupEnrollmentListView,
    EnrollmentDetailView,
    MyCoursesView,
    CourseCatalogView,
    SelfEnrollView,
)
from apps.quizzes.views import CourseQuizResultsView

urlpatterns = [
    # Courses
    path('', CourseListView.as_view(), name='course-list'),
    path('create/', CourseCreateView.as_view(), name='course-create'),
    path('my/', MyCoursesView.as_view(), name='course-my'),
    path('catalog/', CourseCatalogView.as_view(), name='course-catalog'),
    path('<int:pk>/', CourseDetailView.as_view(), name='course-detail'),
    path('<int:pk>/publish/', CoursePublishView.as_view(), {'action': 'publish'}, name='course-publish'),
    path('<int:pk>/unpublish/', CoursePublishView.as_view(), {'action': 'unpublish'}, name='course-unpublish'),

    # Groups
    path('<int:course_id>/groups/', CourseGroupListCreateView.as_view(), name='group-list'),
    path('groups/<int:pk>/', CourseGroupDetailView.as_view(), name='group-detail'),
    path('groups/<int:group_id>/enroll/', EnrollStudentView.as_view(), name='group-enroll'),
    path('groups/<int:group_id>/join/', SelfEnrollView.as_view(), name='group-self-enroll'),
    path('groups/<int:group_id>/students/', GroupEnrollmentListView.as_view(), name='group-students'),

    # Enrollment detail
    path('enrollments/<int:pk>/', EnrollmentDetailView.as_view(), name='enrollment-detail'),

    # Quiz results per course
    path('<int:course_id>/quiz-results/', CourseQuizResultsView.as_view(), name='course-quiz-results'),
]

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
    MyCoursesView,
)

urlpatterns = [
    # Courses
    path('', CourseListView.as_view(), name='course-list'),
    path('create/', CourseCreateView.as_view(), name='course-create'),
    path('my/', MyCoursesView.as_view(), name='course-my'),
    path('<int:pk>/', CourseDetailView.as_view(), name='course-detail'),
    path('<int:pk>/<str:action>/', CoursePublishView.as_view(), name='course-publish'),

    # Groups
    path('<int:course_id>/groups/', CourseGroupListCreateView.as_view(), name='group-list'),
    path('groups/<int:pk>/', CourseGroupDetailView.as_view(), name='group-detail'),
    path('groups/<int:group_id>/enroll/', EnrollStudentView.as_view(), name='group-enroll'),
    path('groups/<int:group_id>/students/', GroupEnrollmentListView.as_view(), name='group-students'),
]

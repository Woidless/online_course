from django.urls import path
from .views import (
    AssignmentListCreateView,
    AssignmentDetailView,
    SubmitAssignmentView,
    SubmissionListView,
    MySubmissionsView,
    GradeSubmissionView,
    ReturnSubmissionView,
)

urlpatterns = [
    # Задания
    path('lessons/<int:lesson_id>/assignments/', AssignmentListCreateView.as_view(), name='assignment-list'),
    path('assignments/<int:pk>/', AssignmentDetailView.as_view(), name='assignment-detail'),
    path('assignments/<int:assignment_id>/submit/', SubmitAssignmentView.as_view(), name='assignment-submit'),
    path('assignments/<int:assignment_id>/submissions/', SubmissionListView.as_view(), name='submission-list'),

    # Ответы
    path('submissions/my/', MySubmissionsView.as_view(), name='submission-my'),
    path('submissions/<int:submission_id>/grade/', GradeSubmissionView.as_view(), name='submission-grade'),
    path('submissions/<int:submission_id>/return/', ReturnSubmissionView.as_view(), name='submission-return'),
]
from rest_framework import serializers
from .models import Quiz, Question, Answer, QuizAttempt


class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ('id', 'text', 'is_correct')


class AnswerStudentSerializer(serializers.ModelSerializer):
    """Для студентов — без поля is_correct"""
    class Meta:
        model = Answer
        fields = ('id', 'text')


class QuestionSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ('id', 'text', 'type', 'order', 'points', 'answers')
        read_only_fields = ('id',)


class QuestionStudentSerializer(serializers.ModelSerializer):
    """Для студентов — варианты без правильных ответов"""
    answers = AnswerStudentSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ('id', 'text', 'type', 'order', 'answers')


class QuizSerializer(serializers.ModelSerializer):
    questions = serializers.SerializerMethodField()
    questions_count = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = (
            'id', 'lesson', 'title', 'description',
            'time_limit', 'passing_score', 'is_published',
            'questions_count', 'questions',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_questions_count(self, obj):
        return obj.questions.count()

    def get_questions(self, obj):
        request = self.context.get('request')
        questions = obj.questions.prefetch_related('answers')
        if request and request.user.role in ('teacher', 'admin'):
            return QuestionSerializer(questions, many=True).data
        return QuestionStudentSerializer(questions, many=True).data


class QuizAttemptSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    passed = serializers.SerializerMethodField()

    class Meta:
        model = QuizAttempt
        fields = (
            'id', 'quiz', 'quiz_title',
            'student', 'student_name',
            'status', 'score', 'passed',
            'answers', 'started_at', 'finished_at',
        )
        read_only_fields = (
            'id', 'student', 'status', 'score',
            'started_at', 'finished_at',
        )

    def get_passed(self, obj):
        if obj.score is None:
            return None
        return obj.score >= obj.quiz.passing_score


class SubmitQuizSerializer(serializers.Serializer):
    """Отправка ответов на тест"""
    answers = serializers.DictField(
        help_text='{"question_id": answer_id} или {"question_id": [id1, id2]} или {"question_id": "текст"}'
    )
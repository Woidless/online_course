from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, date

from apps.users.models import User
from apps.courses.models import Course, CourseGroup, Enrollment
from apps.lessons.models import Lesson, LessonProgress, Schedule, Section
from apps.quizzes.models import Quiz, Question, Answer
from apps.assignments.models import Assignment


USERS = [
    # (email, full_name, role, password, is_staff, is_superuser)
    ('admin@test.com',    'Админ Иванов',        'admin',   'admin123',   True,  True),
    ('teacher1@test.com', 'Алексей Петров',      'teacher', 'teacher123', False, False),
    ('teacher2@test.com', 'Мария Сидорова',      'teacher', 'teacher123', False, False),
    ('student1@test.com', 'Иван Козлов',         'student', 'student123', False, False),
    ('student2@test.com', 'Анна Новикова',       'student', 'student123', False, False),
    ('student3@test.com', 'Дмитрий Морозов',     'student', 'student123', False, False),
    ('student4@test.com', 'Екатерина Волкова',   'student', 'student123', False, False),
    ('student5@test.com', 'Сергей Лебедев',      'student', 'student123', False, False),
]

# Курс 1: Python — с разделами
PYTHON_COURSE = {
    'title': 'Python для начинающих',
    'description': 'Полный курс по Python с нуля. Переменные, функции, ООП, работа с файлами.',
    'teacher_email': 'teacher1@test.com',
    'is_free': True,
    'price': None,
    'is_published': True,
    'sections': [
        {
            'title': 'Основы Python',
            'order': 0,
            'lessons': [
                {
                    'title': 'Введение в Python',
                    'description': 'Установка Python и первая программа.',
                    'content': '# Введение в Python\n\nPython — один из самых популярных языков программирования.\n\n```python\nprint("Hello, World!")\n```',
                    'order': 1,
                    'youtube_url': None,
                },
                {
                    'title': 'Переменные и типы данных',
                    'description': 'int, str, list, dict — разбираем каждый тип.',
                    'content': '# Типы данных\n\n- `int` — целые числа\n- `str` — строки\n- `list` — списки\n- `dict` — словари',
                    'order': 2,
                    'youtube_url': None,
                },
            ],
        },
        {
            'title': 'Функции и модули',
            'order': 1,
            'lessons': [
                {
                    'title': 'Функции',
                    'description': 'Определение функций, аргументы, возвращаемые значения.',
                    'content': '# Функции\n\n```python\ndef greet(name):\n    return f"Привет, {name}!"\n```',
                    'order': 3,
                    'youtube_url': None,
                },
                {
                    'title': 'Модули и пакеты',
                    'description': 'import, from ... import, создание своих модулей.',
                    'content': '# Модули\n\n```python\nimport math\nprint(math.pi)\n```',
                    'order': 4,
                    'youtube_url': None,
                },
            ],
        },
        {
            'title': 'Объектно-ориентированное программирование',
            'order': 2,
            'lessons': [
                {
                    'title': 'Классы и объекты',
                    'description': 'Создание классов, __init__, методы экземпляра.',
                    'content': '# Классы\n\n```python\nclass Dog:\n    def __init__(self, name):\n        self.name = name\n\n    def bark(self):\n        return f"{self.name} говорит: Гав!"\n```',
                    'order': 5,
                    'youtube_url': None,
                },
                {
                    'title': 'Наследование',
                    'description': 'Наследование классов, super(), полиморфизм.',
                    'content': '# Наследование\n\n```python\nclass Animal:\n    def speak(self):\n        pass\n\nclass Cat(Animal):\n    def speak(self):\n        return "Мяу"\n```',
                    'order': 6,
                    'youtube_url': None,
                },
            ],
        },
    ],
}

# Курс 2: DRF — с разделами
DRF_COURSE = {
    'title': 'Django REST Framework',
    'description': 'Создание REST API на Django. Сериализаторы, ViewSets, аутентификация, пермишены.',
    'teacher_email': 'teacher2@test.com',
    'is_free': False,
    'price': '49.99',
    'is_published': True,
    'sections': [
        {
            'title': 'Введение в DRF',
            'order': 0,
            'lessons': [
                {
                    'title': 'Введение в DRF',
                    'description': 'Установка и первый APIView.',
                    'content': '# Django REST Framework\n\nDRF — мощный инструмент для создания API.',
                    'order': 1,
                    'youtube_url': None,
                },
                {
                    'title': 'Сериализаторы',
                    'description': 'ModelSerializer и валидация данных.',
                    'content': '# Сериализаторы\n\n```python\nclass UserSerializer(serializers.ModelSerializer):\n    class Meta:\n        model = User\n        fields = ("id", "email")\n```',
                    'order': 2,
                    'youtube_url': None,
                },
            ],
        },
        {
            'title': 'Аутентификация и безопасность',
            'order': 1,
            'lessons': [
                {
                    'title': 'JWT аутентификация',
                    'description': 'JSON Web Tokens, access и refresh токены.',
                    'content': '# JWT\n\nJSON Web Token — стандарт для безопасной передачи данных.',
                    'order': 3,
                    'youtube_url': None,
                },
            ],
        },
    ],
}

# Курс 3: React — без разделов (уроки без секций)
REACT_COURSE = {
    'title': 'JavaScript и React',
    'description': 'Современный фронтенд: ES6+, хуки React, работа с API.',
    'teacher_email': 'teacher1@test.com',
    'is_free': False,
    'price': '39.99',
    'is_published': False,
    'sections': [
        {
            'title': 'JavaScript ES6+',
            'order': 0,
            'lessons': [
                {
                    'title': 'ES6+ основы',
                    'description': 'const/let, стрелочные функции, деструктуризация.',
                    'content': '# ES6+\n\n```js\nconst greet = (name) => `Привет, ${name}!`\n```',
                    'order': 1,
                    'youtube_url': None,
                },
            ],
        },
        {
            'title': 'React',
            'order': 1,
            'lessons': [
                {
                    'title': 'React компоненты',
                    'description': 'JSX, props, useState.',
                    'content': '# React\n\n```jsx\nfunction App() {\n  return <h1>Hello, React!</h1>\n}\n```',
                    'order': 2,
                    'youtube_url': None,
                },
            ],
        },
    ],
}

ALL_COURSES = [PYTHON_COURSE, DRF_COURSE, REACT_COURSE]


class Command(BaseCommand):
    help = 'Заполняет БД тестовыми данными (пользователи, курсы, группы, уроки, разделы)'

    def handle(self, *args, **options):
        self.stdout.write('Создаём пользователей...')
        created_users = {}
        for email, full_name, role, password, is_staff, is_superuser in USERS:
            user, created = User.objects.update_or_create(
                email=email,
                defaults={
                    'full_name': full_name,
                    'role': role,
                    'is_active': True,
                    'is_staff': is_staff,
                    'is_superuser': is_superuser,
                }
            )
            user.set_password(password)
            user.save()
            created_users[email] = user
            status = 'создан' if created else 'обновлён'
            self.stdout.write(f'  [{role}] {email} — {status}')

        self.stdout.write('Создаём курсы, разделы, уроки, группы...')
        today = date.today()
        students = [u for u in created_users.values() if u.role == 'student']

        for course_data in ALL_COURSES:
            teacher = created_users[course_data['teacher_email']]
            course, _ = Course.objects.update_or_create(
                title=course_data['title'],
                defaults={
                    'description': course_data['description'],
                    'teacher': teacher,
                    'is_free': course_data['is_free'],
                    'price': course_data['price'],
                    'is_published': course_data['is_published'],
                }
            )
            self.stdout.write(f'  Курс: {course.title}')

            # Создаём разделы и уроки
            all_lessons = []
            for sec_data in course_data['sections']:
                section, _ = Section.objects.update_or_create(
                    course=course,
                    title=sec_data['title'],
                    defaults={'order': sec_data['order']}
                )
                self.stdout.write(f'    Раздел: {section.title}')

                for lesson_data in sec_data['lessons']:
                    lesson, _ = Lesson.objects.update_or_create(
                        course=course,
                        title=lesson_data['title'],
                        defaults={
                            'section': section,
                            'description': lesson_data['description'],
                            'content': lesson_data['content'],
                            'order': lesson_data['order'],
                            'is_published': course_data['is_published'],
                            'youtube_url': lesson_data.get('youtube_url'),
                        }
                    )
                    all_lessons.append(lesson)
            self.stdout.write(f'    Итого уроков: {len(all_lessons)}')

            if not course_data['is_published']:
                continue

            # Создаём группу
            group, _ = CourseGroup.objects.update_or_create(
                course=course,
                name=f'Группа А — {course.title[:20]}',
                defaults={
                    'teacher': teacher,
                    'starts_at': today,
                }
            )

            # Расписание
            Schedule.objects.filter(group=group).delete()
            for i, lesson in enumerate(all_lessons):
                Schedule.objects.create(
                    group=group,
                    lesson=lesson,
                    teacher=teacher,
                    scheduled_at=timezone.now() + timedelta(days=i * 7),
                )

            # Зачисляем студентов
            enrolled_students = students[:3]
            for student in enrolled_students:
                Enrollment.objects.get_or_create(
                    student=student,
                    group=group,
                    defaults={'status': 'active'}
                )
                # Первый студент прошёл все уроки, второй — половину
                for j, lesson in enumerate(all_lessons):
                    if student == students[0] or (student == students[1] and j < len(all_lessons) // 2):
                        LessonProgress.objects.get_or_create(
                            student=student,
                            lesson=lesson,
                            defaults={'completed': True, 'completed_at': timezone.now()}
                        )

            self.stdout.write(f'    Группа: {group.name}, студентов: {len(enrolled_students)}')

        self._create_quizzes_and_assignments()

        self.stdout.write(self.style.SUCCESS('\nГотово! Тестовые данные созданы.'))
        self.stdout.write('\nАккаунты для входа:')
        self.stdout.write('  admin@test.com    / admin123')
        self.stdout.write('  teacher1@test.com / teacher123')
        self.stdout.write('  teacher2@test.com / teacher123')
        self.stdout.write('  student1@test.com / student123  (прошёл все уроки)')
        self.stdout.write('  student2@test.com / student123  (прошёл половину уроков)')
        self.stdout.write('  student3@test.com / student123  (записан, ничего не прошёл)')
        self.stdout.write('  student4@test.com / student123  (не записан на курсы)')
        self.stdout.write('  student5@test.com / student123  (не записан на курсы)')

    def _create_quizzes_and_assignments(self):
        self.stdout.write('Создаём квизы и задания...')

        python_lesson1 = Lesson.objects.filter(
            course__title='Python для начинающих', order=1
        ).first()
        python_lesson2 = Lesson.objects.filter(
            course__title='Python для начинающих', order=2
        ).first()
        python_lesson5 = Lesson.objects.filter(
            course__title='Python для начинающих', order=5
        ).first()
        drf_lesson1 = Lesson.objects.filter(
            course__title='Django REST Framework', order=1
        ).first()
        drf_lesson2 = Lesson.objects.filter(
            course__title='Django REST Framework', order=2
        ).first()

        # Квиз 1: Введение в Python
        if python_lesson1:
            quiz, created = Quiz.objects.get_or_create(
                lesson=python_lesson1,
                title='Проверка знаний: Введение в Python',
                defaults={
                    'description': 'Базовые вопросы по первому уроку.',
                    'passing_score': 60,
                    'time_limit': 10,
                    'is_published': True,
                }
            )
            if created:
                q1 = Question.objects.create(
                    quiz=quiz, text='Какой символ используется для комментария в Python?',
                    type='single', order=1
                )
                Answer.objects.bulk_create([
                    Answer(question=q1, text='//', is_correct=False),
                    Answer(question=q1, text='#', is_correct=True),
                    Answer(question=q1, text='--', is_correct=False),
                    Answer(question=q1, text='/*', is_correct=False),
                ])
                q2 = Question.objects.create(
                    quiz=quiz, text='Какие из этих типов данных являются неизменяемыми (immutable)?',
                    type='multiple', order=2
                )
                Answer.objects.bulk_create([
                    Answer(question=q2, text='list', is_correct=False),
                    Answer(question=q2, text='tuple', is_correct=True),
                    Answer(question=q2, text='dict', is_correct=False),
                    Answer(question=q2, text='str', is_correct=True),
                ])
                self.stdout.write(f'  Квиз создан: {quiz.title}')

        # Задание: типы данных
        if python_lesson2:
            Assignment.objects.get_or_create(
                lesson=python_lesson2,
                title='Практика: типы данных Python',
                defaults={
                    'description': (
                        'Напишите программу, которая:\n'
                        '1. Создаёт список из 5 любимых фруктов\n'
                        '2. Выводит их в обратном порядке\n'
                        '3. Считает количество фруктов с буквой "а"\n\n'
                        'Вставьте код в текстовое поле или прикрепите .py файл.'
                    ),
                    'max_score': 100,
                    'due_date': timezone.now() + timedelta(days=7),
                }
            )
            self.stdout.write('  Задание создано: Практика: типы данных Python')

        # Задание: ООП
        if python_lesson5:
            Assignment.objects.get_or_create(
                lesson=python_lesson5,
                title='Практика: создание класса',
                defaults={
                    'description': (
                        'Создайте класс `BankAccount` с:\n'
                        '- атрибутами: `owner` (имя владельца), `balance` (баланс)\n'
                        '- методами: `deposit(amount)`, `withdraw(amount)`, `__str__`\n\n'
                        'Прикрепите файл .py с реализацией.'
                    ),
                    'max_score': 100,
                    'due_date': timezone.now() + timedelta(days=14),
                }
            )
            self.stdout.write('  Задание создано: Практика: создание класса')

        # Квиз DRF
        if drf_lesson1:
            quiz2, created2 = Quiz.objects.get_or_create(
                lesson=drf_lesson1,
                title='Тест: основы DRF',
                defaults={
                    'description': 'Проверяем понимание первого урока по DRF.',
                    'passing_score': 70,
                    'is_published': True,
                }
            )
            if created2:
                q3 = Question.objects.create(
                    quiz=quiz2, text='Что такое APIView в Django REST Framework?',
                    type='single', order=1
                )
                Answer.objects.bulk_create([
                    Answer(question=q3, text='Модель базы данных', is_correct=False),
                    Answer(question=q3, text='Базовый класс для создания API-эндпоинтов', is_correct=True),
                    Answer(question=q3, text='Шаблон HTML', is_correct=False),
                ])
                q4 = Question.objects.create(
                    quiz=quiz2, text='Какой HTTP-метод используется для создания ресурса по REST-соглашению?',
                    type='single', order=2
                )
                Answer.objects.bulk_create([
                    Answer(question=q4, text='GET', is_correct=False),
                    Answer(question=q4, text='POST', is_correct=True),
                    Answer(question=q4, text='DELETE', is_correct=False),
                    Answer(question=q4, text='PATCH', is_correct=False),
                ])
                self.stdout.write(f'  Квиз создан: {quiz2.title}')

        # Задание: DRF сериализатор
        if drf_lesson2:
            Assignment.objects.get_or_create(
                lesson=drf_lesson2,
                title='Напишите сериализатор для модели Product',
                defaults={
                    'description': (
                        'Создайте Django модель `Product` с полями:\n'
                        '- `name` (CharField)\n'
                        '- `price` (DecimalField)\n'
                        '- `in_stock` (BooleanField)\n\n'
                        'Напишите `ProductSerializer` на основе `ModelSerializer`.\n'
                        'Прикрепите .py файл или вставьте код.'
                    ),
                    'max_score': 100,
                    'due_date': timezone.now() + timedelta(days=10),
                }
            )
            self.stdout.write('  Задание создано: Напишите сериализатор для модели Product')

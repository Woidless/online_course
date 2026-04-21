.PHONY: run migrate makemigrations shell createsuperuser install freeze

all_run:
	python3.12 manage.py makemigrations 
	python3.12 manage.py migrate
	python3.12 manage.py check
# Запуск сервера
run:
	python3.12 manage.py runserver
	npm run dev --prefix ./frontend
# Применить миграции
migrate:
	python3.12 manage.py migrate

# Создать миграции
makemigrations:
	python3.12 manage.py makemigrations

# Django shell
shell:
	python3.12 manage.py shell

# Создать суперпользователя
createsuperuser:
	python3.12 manage.py createsuperuser

# Установить зависимости
install:
	pip install -r requirements.txt

# Сохранить зависимости
freeze:
	pip freeze > requirements.txt

# Создать .env из примера
env:
	cp .env.example .env

# Полный сброс БД (осторожно!)
reset-db:
	python3.12 manage.py flush --no-input

# Запустить тесты
test:
	python3.12 manage.py test apps

# Создать новое приложение внутри apps/
startapp:
	mkdir -p apps/$(name) && python3.12 manage.py startapp $(name) apps/$(name)
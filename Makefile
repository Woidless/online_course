PYTHON = python3.12
MANAGE = $(PYTHON) manage.py

.PHONY: help \
        services redis pg \
        back front celery \
        migrate mm shell superuser \
        install install-all freeze \
        test check reset-db startapp

# ─── Справка ──────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "  Сервисы"
	@echo "    make services      — запустить Redis + PostgreSQL"
	@echo "    make redis         — запустить Redis"
	@echo "    make pg            — запустить PostgreSQL"
	@echo ""
	@echo "  Запуск"
	@echo "    make back          — Django dev-сервер (порт 8000)"
	@echo "    make front         — Vite frontend (порт 5173)"
	@echo "    make celery        — Celery worker"
	@echo ""
	@echo "  База данных"
	@echo "    make migrate       — применить миграции"
	@echo "    make mm            — создать миграции (все приложения)"
	@echo "    make mm app=users  — создать миграции для конкретного приложения"
	@echo "    make reset-db      — очистить все данные (осторожно!)"
	@echo ""
	@echo "  Django"
	@echo "    make shell         — Django shell"
	@echo "    make superuser     — создать суперпользователя"
	@echo "    make check         — проверить конфигурацию"
	@echo "    make startapp name=payments  — создать новое приложение"
	@echo ""
	@echo "  Зависимости"
	@echo "    make install       — pip install -r requirements.txt"
	@echo "    make install-all   — pip install + npm install"
	@echo "    make freeze        — обновить requirements.txt"
	@echo ""
	@echo "  Тесты"
	@echo "    make test          — запустить все тесты"
	@echo ""

# ─── Сервисы ──────────────────────────────────────────────────────────────────

services: redis pg

redis:
	sudo service redis-server start
	@redis-cli ping

pg:
	sudo service postgresql start

# ─── Запуск ───────────────────────────────────────────────────────────────────

back:
	$(MANAGE) runserver

front:
	cd frontend && npm run dev

celery:
	celery -A config worker --loglevel=info -E

# ─── База данных ──────────────────────────────────────────────────────────────

migrate:
	$(MANAGE) makemigrations
	$(MANAGE) migrate
	@echo "✓ Миграции применены"

mm:
ifdef app
	$(MANAGE) makemigrations $(app)
else
	$(MANAGE) makemigrations
endif

reset-db:
	@read -p "Удалить все данные? [y/N] " confirm && [ "$$confirm" = "y" ]
	$(MANAGE) flush --no-input
	@echo "✓ База очищена"

# ─── Django ───────────────────────────────────────────────────────────────────

shell:
	$(MANAGE) shell

superuser:
	$(MANAGE) createsuperuser

check:
	$(MANAGE) check

startapp:
	mkdir -p apps/$(name) && $(MANAGE) startapp $(name) apps/$(name)
	@echo "✓ Приложение apps/$(name) создано. Добавь его в LOCAL_APPS в settings.py"

# ─── Зависимости ──────────────────────────────────────────────────────────────

install:
	pip install -r requirements.txt

install-all: install
	cd frontend && npm install

freeze:
	pip freeze > requirements.txt
	@echo "✓ requirements.txt обновлён"

# ─── Тесты ────────────────────────────────────────────────────────────────────

test:
	$(MANAGE) test apps --verbosity=2
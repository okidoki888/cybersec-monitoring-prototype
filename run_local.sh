#!/bin/bash

#################################################################
# Скрипт для запуска проекта БЕЗ Docker
# Требует: Python 3.11+, PostgreSQL 15+, Node.js 18+
#################################################################

set -e

echo "════════════════════════════════════════════════════════════"
echo "  🚀 Запуск проекта локально (без Docker)"
echo "════════════════════════════════════════════════════════════"
echo ""

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция проверки команды
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅ $1 установлен${NC}"
        $1 --version 2>&1 | head -1
        return 0
    else
        echo -e "${RED}❌ $1 не найден${NC}"
        return 1
    fi
}

echo "📋 Проверка зависимостей..."
echo ""

# Проверка Python
if ! check_command python3; then
    echo ""
    echo -e "${YELLOW}Установите Python 3.11+:${NC}"
    echo "  macOS: brew install python@3.11"
    exit 1
fi

# Проверка pip
if ! check_command pip3; then
    echo ""
    echo -e "${RED}pip3 не найден${NC}"
    exit 1
fi

# Проверка PostgreSQL
if ! check_command psql; then
    echo ""
    echo -e "${YELLOW}Установите PostgreSQL:${NC}"
    echo "  macOS: brew install postgresql@15"
    echo "  Запуск: brew services start postgresql@15"
    exit 1
fi

# Проверка Node.js
if ! check_command node; then
    echo ""
    echo -e "${YELLOW}Установите Node.js 18+:${NC}"
    echo "  macOS: brew install node@18"
    exit 1
fi

# Проверка npm
if ! check_command npm; then
    echo ""
    echo -e "${RED}npm не найден${NC}"
    exit 1
fi

echo ""
echo "✅ Все зависимости установлены"
echo ""

# Проверка .env
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Файл .env не найден${NC}"
    echo ""
    echo "Создаю .env из шаблона..."
    cp .env.example .env

    # Генерация JWT_SECRET
    JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

    # Обновление .env
    sed -i '' "s|change-this-to-a-strong-random-secret-at-least-32-characters-long|$JWT_SECRET|g" .env
    sed -i '' "s|postgresql://cybersec:change-this-strong-password@db:5432/cybersec|postgresql://localhost:5432/cybersec|g" .env

    echo -e "${GREEN}✅ Файл .env создан${NC}"
    echo ""
fi

# Загрузка переменных окружения
export $(cat .env | grep -v '^#' | xargs)

# Обновить DATABASE_URL для локального запуска
export DATABASE_URL="postgresql://localhost:5432/cybersec"

echo "════════════════════════════════════════════════════════════"
echo "  📦 Настройка Backend"
echo "════════════════════════════════════════════════════════════"
echo ""

cd backend

echo "📥 Установка Python зависимостей..."
pip3 install -r requirements.txt --quiet

echo "✅ Backend зависимости установлены"
echo ""

# Проверка/создание БД
echo "📊 Проверка базы данных..."

if ! psql -lqt | cut -d \| -f 1 | grep -qw cybersec; then
    echo "🔧 Создаю базу данных cybersec..."
    createdb cybersec || {
        echo -e "${RED}❌ Не удалось создать БД${NC}"
        echo ""
        echo "Попробуйте вручную:"
        echo "  createdb cybersec"
        exit 1
    }
    echo -e "${GREEN}✅ База данных создана${NC}"
else
    echo -e "${GREEN}✅ База данных существует${NC}"
fi

echo ""

cd ..

echo "════════════════════════════════════════════════════════════"
echo "  📦 Настройка Frontend"
echo "════════════════════════════════════════════════════════════"
echo ""

cd frontend

if [ ! -d "node_modules" ]; then
    echo "📥 Установка Node.js зависимостей..."
    npm install
    echo -e "${GREEN}✅ Frontend зависимости установлены${NC}"
else
    echo -e "${GREEN}✅ Node.js зависимости уже установлены${NC}"
fi

echo ""

cd ..

echo "════════════════════════════════════════════════════════════"
echo "  🚀 Запуск приложения"
echo "════════════════════════════════════════════════════════════"
echo ""

echo "Откроются 2 терминальных окна:"
echo "  1. Backend (FastAPI) - http://localhost:8000"
echo "  2. Frontend (React) - http://localhost:3000"
echo ""

# Функция для запуска в новом окне Terminal.app
run_in_new_window() {
    osascript <<END
tell application "Terminal"
    do script "cd '$PROJECT_DIR' && $1"
    activate
end tell
END
}

# Запуск backend
echo "🔵 Запускаю Backend..."
run_in_new_window "cd backend && export JWT_SECRET='$JWT_SECRET' && export DATABASE_URL='$DATABASE_URL' && export ALLOW_OPEN_SIGNUP=true && export ALLOWED_ORIGINS='http://localhost:3000' && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

sleep 2

# Запуск frontend
echo "🟢 Запускаю Frontend..."
run_in_new_window "cd frontend && npm run dev"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ✅ Приложение запускается!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📍 Доступ к приложению:"
echo ""
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo ""
echo "👤 Тестовые пользователи:"
echo ""
echo "   admin / Admin123    (полный доступ)"
echo "   analyst / Analyst123  (аналитик)"
echo "   viewer / Viewer123   (просмотр)"
echo ""
echo "🛑 Для остановки закройте терминальные окна или нажмите Ctrl+C"
echo ""
echo "════════════════════════════════════════════════════════════"

# Ожидание запуска
sleep 5

# Открыть браузер
echo "🌐 Открываю браузер..."
open http://localhost:3000

echo ""
echo "✅ Готово!"

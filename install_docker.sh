#!/bin/bash

#################################################################
# Скрипт автоматической установки Docker Desktop для macOS
# Требует: sudo доступ
#################################################################

set -e

echo "════════════════════════════════════════════════════════════"
echo "  🐳 Установка Docker Desktop для macOS"
echo "════════════════════════════════════════════════════════════"
echo ""

# Проверка macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Этот скрипт работает только на macOS"
    exit 1
fi

# Проверка, установлен ли Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker уже установлен"
    docker --version
    docker compose version
    echo ""
    echo "Запустите проект:"
    echo "  cd $(pwd)"
    echo "  docker compose up --build"
    exit 0
fi

echo "📋 Определяю архитектуру процессора..."
ARCH=$(uname -m)

if [[ "$ARCH" == "arm64" ]]; then
    echo "✅ Обнаружен Apple Silicon (M1/M2/M3)"
    DOCKER_URL="https://desktop.docker.com/mac/main/arm64/Docker.dmg"
elif [[ "$ARCH" == "x86_64" ]]; then
    echo "✅ Обнаружен Intel Mac"
    DOCKER_URL="https://desktop.docker.com/mac/main/amd64/Docker.dmg"
else
    echo "❌ Неизвестная архитектура: $ARCH"
    exit 1
fi

echo ""
echo "📥 Скачиваю Docker Desktop..."
echo "   URL: $DOCKER_URL"
echo ""

# Создать временную папку
TMP_DIR=$(mktemp -d)
cd "$TMP_DIR"

# Скачать Docker.dmg
curl -L -o Docker.dmg "$DOCKER_URL"

echo ""
echo "📀 Монтирую DMG..."
MOUNT_DIR=$(hdiutil attach Docker.dmg | grep Volumes | awk '{print $3}')

echo ""
echo "📦 Копирую Docker.app в /Applications..."
echo "   (потребуется пароль администратора)"

# Копировать в Applications (требует sudo)
sudo cp -R "$MOUNT_DIR/Docker.app" /Applications/

echo ""
echo "🧹 Очистка..."
hdiutil detach "$MOUNT_DIR" -quiet
cd -
rm -rf "$TMP_DIR"

echo ""
echo "✅ Docker Desktop установлен!"
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  📝 Следующие шаги:"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "1. Запустите Docker Desktop:"
echo "   open /Applications/Docker.app"
echo ""
echo "2. При первом запуске:"
echo "   - Введите пароль администратора"
echo "   - Дождитесь завершения инициализации"
echo "   - В menu bar появится значок кита 🐳"
echo ""
echo "3. Проверьте установку:"
echo "   docker --version"
echo "   docker compose version"
echo ""
echo "4. Запустите проект:"
echo "   cd $(pwd)"
echo "   docker compose up --build"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Спросить, запустить ли Docker Desktop сейчас
read -p "Запустить Docker Desktop сейчас? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Запускаю Docker Desktop..."
    open /Applications/Docker.app
    echo ""
    echo "⏳ Дождитесь запуска Docker (значок кита в menu bar)"
    echo "   Это может занять 1-2 минуты при первом запуске"
    echo ""
    echo "После запуска Docker выполните:"
    echo "   docker compose up --build"
fi

echo ""
echo "✅ Готово!"

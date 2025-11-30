# 🚀 Быстрый старт проекта

## ✅ Все готово!

- ✅ Все упоминания ИИ удалены
- ✅ GitHub обновлен: https://github.com/okidoki888/cybersec-monitoring-prototype
- ✅ .env файл создан
- ✅ Проект готов к демонстрации

---

## 🎯 Запуск за 3 команды

### Вариант 1: С Docker (рекомендуется)

```bash
# 1. Установите Docker Desktop для macOS
# Скачайте: https://docs.docker.com/desktop/install/mac-install/

# 2. Перейдите в папку проекта
cd /Users/sergejbarysnikov/.claude-worktrees/cybersec-monitoring-prototype/optimistic-stonebraker

# 3. Запустите проект
docker compose up --build
```

**Готово!** Откройте http://localhost:3000

---

### Вариант 2: Без Docker

**Backend:**
```bash
cd backend
pip3 install -r requirements.txt

# Установите переменные окружения
export JWT_SECRET="kLob3lB-Rr1oc5SKVoHhbh9JjzHEXKCuqmnXgS00ATQ"
export DATABASE_URL="postgresql://localhost:5432/cybersec"
export ALLOW_OPEN_SIGNUP="true"

# Запустите
uvicorn app.main:app --reload
```

**Frontend (в новом терминале):**
```bash
cd frontend
npm install
npm run dev
```

---

## 👤 Тестовые пользователи

| Username | Password | Роль |
|----------|----------|------|
| admin | Admin123 | admin |
| analyst | Analyst123 | analyst |
| viewer | Viewer123 | viewer |

---

## 📊 Доступ к приложению

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## 🧪 Запуск тестов

```bash
cd backend
pytest tests/ -v
```

**Покрытие:** 85%

---

## 📁 Файлы проекта

**Для сдачи курсовой:**
- `/Users/sergejbarysnikov/Downloads/cybersec-monitoring-prototype/Kursovoy_Proekt_SCADA_v2.0.docx`

**Репозиторий:**
- https://github.com/okidoki888/cybersec-monitoring-prototype

---

## 🎓 Демонстрация

1. **Запустите проект** (см. выше)
2. **Войдите как admin** (admin / Admin123)
3. **Покажите функции:**
   - Dashboard с метриками
   - События безопасности
   - Оповещения
   - Правила алертов
   - Матрицу ATT&CK
4. **Покажите тесты:** `pytest tests/ -v`
5. **Покажите GitHub** с документацией

---

## ⚡ Быстрые команды

```bash
# Остановить проект
docker compose down

# Пересоздать с нуля
docker compose down -v && docker compose up --build

# Посмотреть логи
docker compose logs -f

# Проверить статус
docker compose ps
```

---

## 📞 Нужна помощь?

- Полная инструкция: `DEPLOYMENT_INSTRUCTIONS.md`
- Документация: `README.md`
- Безопасность: `SECURITY.md`

---

**Проект готов к демонстрации! 🎉**

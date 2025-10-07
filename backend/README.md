# Система управления дефектами

Полнофункциональная система для управления дефектами в строительных проектах с поддержкой ролей, отчетности и безопасности.

## 🚀 Возможности

### Функциональные требования
- ✅ Регистрация и аутентификация пользователей (JWT)
- ✅ Разграничение прав доступа (менеджер, инженер, наблюдатель)
- ✅ Управление проектами и этапами
- ✅ Создание и редактирование дефектов
- ✅ Управление статусами: Новая → В работе → На проверке → Закрыта/Отменена
- ✅ Комментарии и история изменений
- ✅ Поиск, сортировка и фильтрация
- ✅ Экспорт в CSV/Excel
- ✅ Аналитические отчеты и графики

### Безопасность
- ✅ Хеширование паролей (bcrypt)
- ✅ Защита от SQL-инъекций
- ✅ Защита от XSS
- ✅ CSRF защита
- ✅ Rate limiting
- ✅ Логирование действий
- ✅ Резервное копирование БД
- ✅ Контроль доступа к логам

## 📋 Требования

- Node.js >= 16.0.0
- PostgreSQL >= 12.0
- npm >= 8.0.0

## 🛠️ Установка

### 1. Клонирование репозитория

```bash
git clone https://github.com/ptmff/project1
cd defect-tracking-system
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка базы данных

Создайте базу данных PostgreSQL:

```sql
CREATE DATABASE defect_tracking_db;
CREATE USER defect_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE defect_tracking_db TO defect_user;
```

### 4. Настройка переменных окружения

Отредактируйте `.env` файл с вашими настройками.

### 5. Запуск приложения

```bash
# Режим разработки
npm run dev

# Режим production
npm start
```

Сервер запустится на `http://localhost:3000`

## 📁 Структура проекта

```
defect-tracking-system/
├── middleware/
│   ├── authMiddleware.js      # JWT аутентификация
│   ├── authorizeRoles.js      # Проверка ролей
│   └── security.js            # Middleware безопасности
├── models/
│   ├── User.js               # Модель пользователя
│   ├── Project.js            # Модель проекта
│   ├── Stage.js              # Модель этапа
│   ├── Defect.js             # Модель дефекта
│   ├── Attachment.js         # Модель вложения
│   ├── Comment.js            # Модель комментария
│   ├── ChangeHistory.js      # История изменений
│   └── index.js              # Связи между моделями
├── routes/
│   ├── auth.js               # Регистрация/логин
│   ├── projects.js           # CRUD проектов
│   ├── stages.js             # CRUD этапов
│   ├── defects.js            # CRUD дефектов
│   ├── uploads.js            # Загрузка файлов
│   ├── reports.js            # Отчеты и экспорт
│   └── protectedRoute.js     # Защищенные маршруты
├── utils/
│   ├── logger.js             # Логирование (Winston)
│   ├── validation.js         # Валидация данных
│   ├── changeTracker.js      # Отслеживание изменений
│   └── exportUtils.js        # Экспорт в CSV/Excel
├── scripts/
│   └── backup.js             # Резервное копирование
├── logs/                     # Логи приложения
├── uploads/                  # Загруженные файлы
├── backups/                  # Резервные копии БД
├── app.js                    # Главный файл приложения
├── db.js                     # Подключение к БД
├── .env.example              # Пример конфигурации
└── package.json              # Зависимости
```

## 🔐 API Endpoints

### Аутентификация

#### Регистрация
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "user123",
  "password": "SecurePass123!",
  "role": "engineer"
}
```

#### Логин
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "user123",
  "password": "SecurePass123!"
}
```

### Проекты

#### Получить все проекты
```http
GET /api/projects?page=1&limit=20&search=keyword&status=active
Authorization: Bearer <token>
```

#### Создать проект (только менеджеры)
```http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Название проекта",
  "description": "Описание",
  "status": "active",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31"
}
```

### Дефекты

#### Получить все дефекты с фильтрацией
```http
GET /api/defects?projectId=xxx&status=new&priority=high&page=1&limit=20
Authorization: Bearer <token>
```

#### Создать дефект
```http
POST /api/defects
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectId": "project-uuid",
  "stageId": "stage-uuid",
  "title": "Заголовок дефекта",
  "description": "Подробное описание",
  "priority": "high",
  "assigneeId": "user-uuid",
  "dueDate": "2025-11-01"
}
```

#### Обновить дефект
```http
PUT /api/defects/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in_progress",
  "priority": "critical"
}
```

#### Добавить комментарий
```http
POST /api/defects/:id/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Текст комментария"
}
```

### Загрузка файлов

#### Загрузить файл к дефекту
```http
POST /api/uploads/defect/:defectId
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
```

#### Скачать файл
```http
GET /api/uploads/:attachmentId
Authorization: Bearer <token>
```

### Отчеты

#### Получить статистику
```http
GET /api/reports/stats?projectId=xxx&startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer <token>
```

#### Экспорт в CSV
```http
GET /api/reports/export/csv?projectId=xxx&status=closed
Authorization: Bearer <token>
```

#### Экспорт в Excel
```http
GET /api/reports/export/excel?projectId=xxx
Authorization: Bearer <token>
```

## 👥 Роли пользователей

### Manager (Менеджер)
- Полный доступ ко всем функциям
- Создание/редактирование проектов и этапов
- Назначение задач
- Удаление дефектов
- Формирование отчетов

### Engineer (Инженер)
- Создание и редактирование дефектов
- Обновление статусов
- Добавление комментариев
- Загрузка файлов
- Просмотр отчетов

### Observer (Наблюдатель)
- Только просмотр информации
- Доступ к отчетам
- Просмотр дефектов и комментариев

## 🔒 Безопасность

### Хеширование паролей
Пароли хешируются с использованием bcrypt с salt rounds = 10.

### JWT токены
- Токены действительны 24 часа (настраивается)
- Подпись с использованием секретного ключа
- Токен передается в заголовке: `Authorization: Bearer <token>`

### Rate Limiting
- Авторизация: 5 попыток за 15 минут
- API: 100 запросов за 15 минут

### Логирование
Все действия логируются в:
- `logs/combined.log` - все логи
- `logs/error.log` - только ошибки
- `logs/security.log` - события безопасности

## 💾 Резервное копирование

### Создать бэкап
```bash
npm run backup
```

### Восстановить из бэкапа
```bash
npm run restore backups/backup_2025-10-07.sql.gz
```

### Список бэкапов
```bash
npm run list-backups
```

### Автоматическое резервное копирование
Настройте cron для автоматического создания бэкапов:

```bash
# Каждый день в 2:00 ночи
0 2 * * * cd /path/to/project && npm run backup
```

## 📊 Мониторинг

### Health Check
```http
GET /health
```

Возвращает статус системы и время работы.

## 🐛 Отладка

### Включить подробное логирование SQL
В `db.js` установите `logging: console.log`

### Просмотр логов
```bash
tail -f logs/combined.log
tail -f logs/error.log
```

## 🚀 Развертывание в Production

1. Установите `NODE_ENV=production` в `.env`
2. Используйте сильный `JWT_SECRET`
3. Настройте HTTPS (nginx/Apache)
4. Используйте миграции вместо `sync()`
5. Настройте мониторинг (PM2, Prometheus)
6. Регулярное резервное копирование
7. Ограничьте CORS для вашего домена

### PM2
```bash
npm install -g pm2
pm2 start app.js --name defect-tracker
pm2 save
pm2 startup
```

## 📝 Лицензия

MIT


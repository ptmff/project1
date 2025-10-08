

# Defect Tracking System

**Полнофункциональная система управления дефектами** для строительных и инженерных проектов с поддержкой ролей, аналитики, отчетов и безопасной архитектуры.
Проект разделен на два модуля: **backend (Node.js + Express + PostgreSQL)** и **frontend (Vue 3 + Pinia + Vite)**.

---

## Возможности

### Основной функционал

* Регистрация и аутентификация пользователей (JWT)
* Разграничение прав доступа: **Manager**, **Engineer**, **Observer**
* Управление проектами и этапами
* Создание, редактирование и удаление дефектов
* Статусы дефектов: *New → In Progress → Review → Closed/Cancelled*
* Комментарии, вложения и история изменений
* Поиск, фильтрация и сортировка
* Аналитические отчеты и визуализация данных

### Безопасность

* Хеширование паролей с использованием `bcrypt`
* JWT авторизация и контроль срока действия токена
* Защита от XSS и SQL-инъекций
* CSRF защита
* Ограничение частоты запросов (rate limiting)
* Логирование и аудит действий
* Резервное копирование базы данных
* Контроль доступа к логам и отчетам

---

## Технологический стек

| Компонент      | Технологии                                                    |
| -------------- | ------------------------------------------------------------- |
| Backend        | Node.js, Express, PostgreSQL, Sequelize, bcrypt, JWT, Winston |
| Frontend       | Vue 3, Pinia, Vue Router, Vite                                |
| Инфраструктура | Docker (PostgreSQL), PM2, dotenv                              |
| Экспорт данных | CSV, XLSX                                                     |

---

## Структура проекта

```
defect-tracking-system/
├── backend/               # Серверная часть (Node.js)
│   ├── middleware/        # Middleware: auth, roles, security
│   ├── models/            # Sequelize модели
│   ├── routes/            # Маршруты API
│   ├── utils/             # Утилиты (валидация, логирование, экспорт)
│   ├── scripts/           # Скрипты резервного копирования
│   ├── logs/              # Логи приложения
│   ├── uploads/           # Загруженные файлы
│   ├── backups/           # Резервные копии БД
│   ├── app.js             # Точка входа
│   ├── db.js              # Подключение к базе данных
│   └── .env.example       # Пример конфигурации
│
├── frontend/              # Клиентская часть (Vue 3 + Vite)
│   ├── src/
│   │   ├── api/           # Работа с API
│   │   ├── components/    # Компоненты интерфейса
│   │   ├── stores/        # Хранилище (Pinia)
│   │   ├── router/        # Маршрутизация
│   │   ├── views/         # Основные страницы
│   │   └── utils/         # Константы и вспомогательные функции
│   ├── public/
│   ├── vite.config.mjs
│   └── package.json
│
└── README.md
```

---

## Установка и запуск

### 1. Клонирование репозитория

```bash
git clone https://github.com/ptmff/project1
cd defect-tracking-system
```

### 2. Настройка и запуск backend

#### Установка зависимостей

```bash
cd backend
npm install
```

#### Настройка базы данных PostgreSQL

```sql
CREATE DATABASE defect_tracking_db;
CREATE USER defect_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE defect_tracking_db TO defect_user;
```

#### Конфигурация `.env`

Скопируйте `.env.example` и заполните значения:

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=defect_tracking_db
DB_USER=defect_user
DB_PASS=your_password
JWT_SECRET=super_secret_key
```

#### Запуск сервера

```bash
# Режим разработки
npm run dev

# Production
npm start
```

Сервер доступен по адресу: [http://localhost:3000](http://localhost:3000)

---

### 3. Настройка и запуск frontend

#### Установка зависимостей

```bash
cd ../frontend
npm install
```

#### Запуск в режиме разработки

```bash
npm run dev
```

Фронтенд доступен по адресу: [http://localhost:5173](http://localhost:5173)

---

## API Endpoints

### Аутентификация

| Метод | Endpoint             | Описание                 |
| ----- | -------------------- | ------------------------ |
| POST  | `/api/auth/register` | Регистрация пользователя |
| POST  | `/api/auth/login`    | Вход и получение JWT     |

### Проекты

| Метод  | Endpoint            | Описание                          |
| ------ | ------------------- | --------------------------------- |
| GET    | `/api/projects`     | Получить список проектов          |
| POST   | `/api/projects`     | Создать проект *(только Manager)* |
| PUT    | `/api/projects/:id` | Обновить проект                   |
| DELETE | `/api/projects/:id` | Удалить проект                    |

### Дефекты

| Метод  | Endpoint                    | Описание                                         |
| ------ | --------------------------- | ------------------------------------------------ |
| GET    | `/api/defects`              | Получить список дефектов (фильтрация, пагинация) |
| POST   | `/api/defects`              | Создать дефект                                   |
| PUT    | `/api/defects/:id`          | Обновить дефект                                  |
| DELETE | `/api/defects/:id`          | Удалить дефект                                   |
| POST   | `/api/defects/:id/comments` | Добавить комментарий                             |
| POST   | `/api/uploads/defect/:id`   | Загрузить файл                                   |

---

## Роли пользователей

| Роль         | Описание                                           |
| ------------ | -------------------------------------------------- |
| **Manager**  | Полный доступ, создание проектов, этапов и отчетов |
| **Engineer** | Работа с дефектами, комментарии, загрузка файлов   |
| **Observer** | Только просмотр и аналитика                        |

---

## Отчеты и экспорт

* `/api/reports/stats` — сводная статистика
* `/api/reports/export/csv` — экспорт в CSV
* `/api/reports/export/excel` — экспорт в Excel

---

## Безопасность

* Хеширование паролей (`bcrypt`)
* JWT токены с ограниченным сроком действия
* CSRF и XSS защита
* Ограничение частоты запросов (rate limiting)
* Логирование событий (Winston)
* Регулярное резервное копирование БД

---

## Резервное копирование

```bash
# Создание резервной копии
npm run backup

# Восстановление из резервной копии
npm run restore backups/backup_2025-10-07.sql.gz

# Список доступных резервных копий
npm run list-backups
```

Пример настройки cron для ежедневного резервного копирования:

```bash
0 2 * * * cd /path/to/backend && npm run backup
```

---

## Развертывание в production

1. Установите `NODE_ENV=production`
2. Настройте надежный `JWT_SECRET`
3. Настройте HTTPS (через Nginx или Apache)
4. Используйте **PM2** для управления процессом:

```bash
npm install -g pm2
pm2 start app.js --name defect-tracker
pm2 save
pm2 startup
```

---

## Интерфейс (Frontend)

* Современный минималистичный дизайн в стиле *glassmorphism*
* Адаптивная верстка для всех устройств
* Удобные фильтры по проекту, этапу, статусу и приоритету
* Работа без перезагрузок страниц
* Поддержка комментариев и вложений в карточке дефекта

---

## Health Check

```http
GET /health
```

Возвращает состояние системы и время работы сервера.

---

## Лицензия

**MIT License**
© 2025 — Defect Tracking System by ptmff


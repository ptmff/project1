// scripts/backup.js
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
require('dotenv').config();

const execAsync = promisify(exec);

// Папка для хранения бэкапов
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const MAX_BACKUPS = 7; // Хранить последние 7 бэкапов

// Создаем папку для бэкапов, если её нет
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Создание резервной копии базы данных PostgreSQL
 */
async function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `backup_${timestamp}.sql`);

    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
    };

    console.log(`Creating backup: ${backupFile}`);

    // Команда pg_dump для создания бэкапа
    const command = `PGPASSWORD="${dbConfig.password}" pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -F c -f "${backupFile}"`;

    await execAsync(command);

    console.log(`✓ Backup created successfully: ${backupFile}`);

    // Сжимаем бэкап для экономии места
    await compressBackup(backupFile);

    // Удаляем старые бэкапы
    await cleanOldBackups();

    return backupFile;
  } catch (err) {
    console.error('✗ Backup failed:', err.message);
    throw err;
  }
}

/**
 * Сжатие бэкапа с помощью gzip
 */
async function compressBackup(backupFile) {
  try {
    const compressedFile = `${backupFile}.gz`;
    await execAsync(`gzip "${backupFile}"`);
    console.log(`✓ Backup compressed: ${compressedFile}`);
    return compressedFile;
  } catch (err) {
    console.error('✗ Compression failed:', err.message);
    // Продолжаем работу даже если сжатие не удалось
  }
}

/**
 * Удаление старых бэкапов (оставляем только MAX_BACKUPS)
 */
async function cleanOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup_') && (file.endsWith('.sql') || file.endsWith('.gz')))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > MAX_BACKUPS) {
      const filesToDelete = files.slice(MAX_BACKUPS);
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        console.log(`✓ Deleted old backup: ${file.name}`);
      }
    }
  } catch (err) {
    console.error('✗ Failed to clean old backups:', err.message);
  }
}

/**
 * Восстановление из бэкапа
 */
async function restoreBackup(backupFile) {
  try {
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
    };

    console.log(`Restoring from backup: ${backupFile}`);

    // Если файл сжат, сначала распаковываем
    let fileToRestore = backupFile;
    if (backupFile.endsWith('.gz')) {
      await execAsync(`gunzip -k "${backupFile}"`);
      fileToRestore = backupFile.replace('.gz', '');
    }

    // Команда pg_restore для восстановления
    const command = `PGPASSWORD="${dbConfig.password}" pg_restore -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -c "${fileToRestore}"`;

    await execAsync(command);

    console.log(`✓ Database restored successfully from: ${backupFile}`);

    // Удаляем временно распакованный файл
    if (backupFile.endsWith('.gz') && fs.existsSync(fileToRestore)) {
      fs.unlinkSync(fileToRestore);
    }

    return true;
  } catch (err) {
    console.error('✗ Restore failed:', err.message);
    throw err;
  }
}

/**
 * Список доступных бэкапов
 */
function listBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup_') && (file.endsWith('.sql') || file.endsWith('.gz')))
      .map(file => {
        const stats = fs.statSync(path.join(BACKUP_DIR, file));
        return {
          name: file,
          path: path.join(BACKUP_DIR, file),
          size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
          created: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    return files;
  } catch (err) {
    console.error('✗ Failed to list backups:', err.message);
    return [];
  }
}

// Запуск скрипта из командной строки
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'create':
      createBackup()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;

    case 'restore':
      const backupFile = process.argv[3];
      if (!backupFile) {
        console.error('Please provide backup file path');
        process.exit(1);
      }
      restoreBackup(backupFile)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;

    case 'list':
      const backups = listBackups();
      console.log('\nAvailable backups:');
      console.table(backups);
      process.exit(0);
      break;

    default:
      console.log(`
Usage:
  node scripts/backup.js create              - Create a new backup
  node scripts/backup.js restore <file>      - Restore from backup file
  node scripts/backup.js list                - List all available backups

Examples:
  node scripts/backup.js create
  node scripts/backup.js restore backups/backup_2025-10-07.sql.gz
  node scripts/backup.js list
      `);
      process.exit(0);
  }
}

module.exports = {
  createBackup,
  restoreBackup,
  listBackups,
};
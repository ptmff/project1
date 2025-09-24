// db.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false, // включите true для дополнительного логирования SQL
    pool: {
      max: 10,
      min: 0,
      idle: 10000,
    },
  }
);

module.exports = sequelize;

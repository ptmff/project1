// models/ChangeHistory.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../db');

class ChangeHistory extends Model {}

ChangeHistory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    defectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'defects',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    field: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    oldValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    newValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    action: {
      type: DataTypes.ENUM('created', 'updated', 'deleted'),
      defaultValue: 'updated',
    },
  },
  {
    sequelize,
    modelName: 'ChangeHistory',
    tableName: 'change_history',
    timestamps: true,
    updatedAt: false,
  }
);

module.exports = ChangeHistory;
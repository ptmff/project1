// models/Comment.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../db');

class Comment extends Model {}

Comment.init(
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { len: [1, 5000] },
    },
  },
  {
    sequelize,
    modelName: 'Comment',
    tableName: 'comments',
    timestamps: true,
  }
);

module.exports = Comment;
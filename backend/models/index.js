// models/index.js - Связи между моделями
const User = require('./User');
const Project = require('./Project');
const Stage = require('./Stage');
const Defect = require('./Defect');
const Attachment = require('./Attachment');
const Comment = require('./Comment');
const ChangeHistory = require('./ChangeHistory');

// Связи для Project
Project.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Project.hasMany(Stage, { foreignKey: 'projectId', as: 'stages' });
Project.hasMany(Defect, { foreignKey: 'projectId', as: 'defects' });

// Связи для Stage
Stage.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Stage.hasMany(Defect, { foreignKey: 'stageId', as: 'defects' });

// Связи для Defect
Defect.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Defect.belongsTo(Stage, { foreignKey: 'stageId', as: 'stage' });
Defect.belongsTo(User, { as: 'assignee', foreignKey: 'assigneeId' });
Defect.belongsTo(User, { as: 'reporter', foreignKey: 'reporterId' });
Defect.hasMany(Attachment, { foreignKey: 'defectId', as: 'attachments' });
Defect.hasMany(Comment, { foreignKey: 'defectId', as: 'comments' });
Defect.hasMany(ChangeHistory, { foreignKey: 'defectId', as: 'history' });

// Связи для Attachment
Attachment.belongsTo(Defect, { foreignKey: 'defectId', as: 'defect' });
Attachment.belongsTo(User, { as: 'uploader', foreignKey: 'uploadedBy' });

// Связи для Comment
Comment.belongsTo(Defect, { foreignKey: 'defectId', as: 'defect' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// Связи для ChangeHistory
ChangeHistory.belongsTo(Defect, { foreignKey: 'defectId', as: 'defect' });
ChangeHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  User,
  Project,
  Stage,
  Defect,
  Attachment,
  Comment,
  ChangeHistory,
};
import { DataTypes } from 'sequelize';
import cuid from 'cuid';
import db from '../../db';

const { sequelize } = db;

const UserSessionDump = sequelize.define(
  'UserSessionDump',
  {
    id: {
      type: DataTypes.STRING,
      defaultValue: cuid(),
      primaryKey: true,
    },
    userId: { type: DataTypes.STRING, allowNull: false },
    classroomId: { type: DataTypes.STRING, allowNull: false },
    topicId: { type: DataTypes.STRING, allowNull: false },
    componentId: { type: DataTypes.STRING, allowNull: false },
    recordRawDump: { type: DataTypes.ARRAY(DataTypes.JSONB), allowNull: false },
    componentType: { type: DataTypes.STRING, allowNull: false },
    eventType: { type: DataTypes.STRING, allowNull: false },
    mongoDocCreatedAt: { type: DataTypes.DATE, allowNull: false },
    mongoDocUpdatedAt: { type: DataTypes.DATE, allowNull: false },
    sessionId: { type: DataTypes.STRING },
  },
  {
    sequelize,
    isPgModel: true,
    tableName: 'userSessionDump',
    modelName: 'UserSessionDump',
  },
);

export default UserSessionDump;

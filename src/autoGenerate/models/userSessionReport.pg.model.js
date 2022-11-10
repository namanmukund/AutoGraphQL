import { DataTypes } from 'sequelize';
import cuid from 'cuid';
import db from '../../db';

const { sequelize } = db;

const UserSessionDump = sequelize.define(
  'UserSessionReport',
  {
    id: {
      type: DataTypes.STRING,
      defaultValue: cuid(),
      primaryKey: true,
    },
    studentName: { type: DataTypes.STRING, allowNull: false },
    userRole: { type: DataTypes.STRING, allowNull: false },
    studentEmail: { type: DataTypes.STRING, allowNull: false },
    studentGrade: { type: DataTypes.STRING, allowNull: false },
    studentSection: { type: DataTypes.STRING, allowNull: false },
    classroomId: { type: DataTypes.STRING, allowNull: false },
    classroomTitle: { type: DataTypes.TEXT, allowNull: false },
    schoolId: { type: DataTypes.STRING, allowNull: false },
    schoolName: { type: DataTypes.TEXT, allowNull: false },
    topicId: { type: DataTypes.STRING, allowNull: false },
    sessionId: { type: DataTypes.STRING, allowNull: false },
    sessionTitle: { type: DataTypes.TEXT, allowNull: false },
    sessionType: { type: DataTypes.TEXT, allowNull: false },
    courseTitle: { type: DataTypes.TEXT },
    courseCategory: { type: DataTypes.TEXT },
    sessionStart: { type: DataTypes.DATE, allowNull: false },
    sessionEnd: { type: DataTypes.DATE, allowNull: false },
    sessionDuration: { type: DataTypes.INTEGER, allowNull: false },
    sessionStatus: { type: DataTypes.STRING, allowNull: false },
    studentAttendance: { type: DataTypes.BOOLEAN },
    classworkVisited: { type: DataTypes.INTEGER, allowNull: false },
    classworkAttempted: { type: DataTypes.INTEGER, allowNull: false },
    homeworkVisited: { type: DataTypes.INTEGER, allowNull: false },
    homeworkAttempted: { type: DataTypes.INTEGER, allowNull: false },
    classworkScore: { type: DataTypes.INTEGER, allowNull: false },
    homeworkScore: { type: DataTypes.INTEGER, allowNull: false },
    proficiency: { type: DataTypes.INTEGER, allowNull: false },
    homeworkExists: { type: DataTypes.BOOLEAN, allowNull: false },
    videoComponentLog: { type: DataTypes.ARRAY(DataTypes.JSONB) },
    pqComponentLog: { type: DataTypes.ARRAY(DataTypes.JSONB) },
    classworkAssignentLog: { type: DataTypes.ARRAY(DataTypes.JSONB) },
    homeworkAssignmentLog: { type: DataTypes.ARRAY(DataTypes.JSONB) },
    classworkPracticeLog: { type: DataTypes.ARRAY(DataTypes.JSONB) },
    homeworkPracticeLog: { type: DataTypes.ARRAY(DataTypes.JSONB) },
    classworkProjectLog: { type: DataTypes.ARRAY(DataTypes.JSONB) },
    homeworkQuizLog: { type: DataTypes.ARRAY(DataTypes.JSONB) },
  },
  {
    sequelize,
    isPgModel: true,
    tableName: 'userSessionReport',
    modelName: 'UserSessionReport',
  },
);

export default UserSessionDump;

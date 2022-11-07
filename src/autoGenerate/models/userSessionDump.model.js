import { DataTypes } from 'sequelize';
import db from '../../db';

const { sequelize } = db;

const UserSessionDump = sequelize.define(
  'UserSessionDump',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    componentType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'userSessionDump',
    modelName: 'UserSessionDump',
  },
);

export default UserSessionDump;

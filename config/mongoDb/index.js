import getDbName from '../../utils/getDbName';

const DATABASE_HOST = process.env.DATABASE_HOST || 'localhost';
const DATABASE_PORT = process.env.DATABASE_PORT || '27017';
const DATABASE_NAME = process.env.DATABASE_NAME || getDbName();
const MONGODB_URI = process.env.MONGODB_URI || `mongodb://${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`;

const dbConfig = {
  host: DATABASE_HOST,
  port: DATABASE_PORT,
  dbUri: MONGODB_URI,
};

export default dbConfig;

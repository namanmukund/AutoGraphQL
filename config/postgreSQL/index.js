import { log } from '../../utils';
import getDbNAme from '../../utils/getDbName';

const DATABASE_HOST = process.env.PG_DATABASE_HOST || 'localhost';
const DATABASE_PORT = process.env.PG_DATABASE_PORT || '5432';
const DATABASE_NAME = process.env.PG_DATABASE_NAME || getDbNAme();
const DATABASE_DIALECT = process.env.PG_DATABASE_DIALECT || 'postgres';

const dbConfig = {
  host: DATABASE_HOST,
  port: DATABASE_PORT,
  name: DATABASE_NAME,
  password: process.env.PG_DATABASE_PASSWORD,
  username: process.env.PG_DATABASE_USERNAME,
  dialect: DATABASE_DIALECT,
  uri: process.env.PG_DATABASE_URI,
  logging: log,
};

export default dbConfig;

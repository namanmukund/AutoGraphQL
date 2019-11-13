import getDbName from '../../utils/getDbName';

const DATABASE_HOST = process.env.DATABASE_HOST || 'localhost';
const DATABASE_PORT = process.env.DATABASE_PORT || '27017';
const DATABASE_NAME = process.env.DATABASE_NAME || getDbName();
const { MONGODB_URI } = process.env;
// change this accordingly
const username = 'heroku_hxn1pfw1';
const password = 'tekie123';
const authSource = 'admin';

const config = {
  test: {
    // mongodb connection settings
    database: {
      host: DATABASE_HOST,
      port: DATABASE_PORT,
      db: MONGODB_URI || `mongodb://${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`,
    },
  },
  development: {
    // mongodb connection settings
    database: {
      host: DATABASE_HOST,
      port: DATABASE_PORT,
      db: MONGODB_URI || `mongodb://${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`,
    },
  },
  staging: {
    // mongodb connection settings
    database: {
      host: DATABASE_HOST,
      port: DATABASE_PORT,
      db: MONGODB_URI || `mongodb://${username}:${password}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}?authSource=${authSource}`,
    },
  },
  production: {
    // mongodb connection settings
    database: {
      host: DATABASE_HOST,
      port: DATABASE_PORT,
      db: MONGODB_URI || `mongodb://${username}:${password}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}?authSource=${authSource}`,
    },
  },
};

export default config;

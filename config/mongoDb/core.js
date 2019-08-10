import getDbName from '../../utils/getDbName';

const DATABASE_HOST = process.env.DATABASE_HOST || 'localhost';
const DATABASE_PORT = process.env.DATABASE_PORT || '27017';
const DATABASE_NAME = process.env.DATABASE_NAME || getDbName();
const MONGODB_URI = process.env.MONGODB_URI;
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
      db: 'mongodb://heroku_25mkw084:nore63drbvb10kjfadcl4bulcr@ds235947.mlab.com:35947/heroku_25mkw084?authSource=heroku_25mkw084',
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

// mongodb://heroku_25mkw084:nore63drbvb10kjfadcl4bulcr@ds235947.mlab.com:35947/heroku_25mkw084?authSource=heroku_25mkw084
// db: MONGODB_URI || `mongodb://${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`,

export default config;

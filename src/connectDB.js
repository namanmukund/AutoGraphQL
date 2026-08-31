import { log, dbConfig } from '../utils';
import db from './db';
import createScheduler from '../utils/createScheduler';
import reRunJobsFromDB from '../utils/scheduleJobs/reRunJobsFromDB';

const { mongoose, sequelize } = db;

// 1. Initialize PostgreSQL connection if configured
if (sequelize) {
  const syncOptions = ((process.env.NODE_ENV !== 'production') || process.env.FORCE_PG_ALTER)
    ? { alter: true }
    : undefined;

  const initPostgres = async () => {
    try {
      if (syncOptions) {
        await sequelize.sync(syncOptions);
      } else {
        await sequelize.authenticate();
      }
      log('Connected to PostgreSQL database.', 'status');
    } catch (err) {
      log(`PostgreSQL notice: ${err.message}`, 'status');
    }
  };

  initPostgres();
}

// 2. Initialize MongoDB connection with auto-reconnection
let dbReconnectCount = 1;
if (mongoose) {
  mongoose.on('error', (err) => {
    log(`Failed to connect to MongoDB: ${err.message || err}`, 'error');
    if (err.message && err.message.match(/failed to connect to server .* on first connect/)) {
      setTimeout(() => {
        log(`Retry count ${dbReconnectCount}. Reconnecting to MongoDB...`, 'status');
        dbReconnectCount += 1;
        mongoose.openUri(dbConfig.dbUri);
      }, 5000);
    }
  });

  mongoose.on('reconnected', () => {
    log('MongoDB reconnected successfully.', 'status');
  });

  mongoose.on('disconnected', () => {
    log('MongoDB connection disconnected.', 'status');
  });

  mongoose.once('open', async () => {
    log('Connected to MongoDB database.', 'status');
    if (process.env.IS_SCHEDULER_INSTANCE && process.env.IS_SCHEDULER_INSTANCE !== 'false') {
      createScheduler('autoDeleteBlacklistedTokens');
      reRunJobsFromDB();
    }
  });
}

export default db;

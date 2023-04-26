/* eslint-disable no-console */
import { log, dbConfig } from '../utils';
import db from './db';
import createScheduler from '../utils/createScheduler';
import reRunJobsFromDB from '../utils/scheduleJobs/reRunJobsFromDB';
import { TAT } from '../constants';

const { mongoose, sequelize } = db;

if ((process.env.NODE_ENV !== 'production') || process.env.FORCE_PG_ALTER) {
  sequelize.sync({ alter: true });
  log('Connected to SQL DB.');
} else {
  sequelize.authenticate();
  log('Connected to SQL DB.');
}

let dbReconnectCount = 1;
mongoose.on('error', (err) => {
  log(`Failed to connect to DB. Error being ${err}`);
  if (err.message && err.message.match(/failed to connect to server .* on first connect/)) {
    // Wait for a bit, then try to connect again
    setTimeout(() => {
      log(`Retry count ${dbReconnectCount}. Reconnecting to DB`);
      dbReconnectCount += 1;
      mongoose.openUri(dbConfig.dbUri);
    }, 5 * 1000);
  }
}).on('reconnected', () => {
  log('MongoDB reconnected!');
}).on('disconnected', () => {
  log('MongoDB disconnected!');
}).once('open', async () => {
  log('Connected to MongoDB.');
  if (
    process.env.NODE_ENV === 'production'
    && process.env.IS_SCHEDULER_INSTANCE
    && process.env.IS_SCHEDULER_INSTANCE !== 'false') {
    createScheduler('mentorReport');
    createScheduler('batchSessionOtpGeneration');
    createScheduler('autoCompleteThoeryClassroomSessions');
    createScheduler('b2cBatchSessionReport');
    createScheduler('autoDeleteBlacklistedTokens');
    reRunJobsFromDB();
  }
  if(process.env.STAGING_INSTANCE ||  process.env.STAGING_INSTANCE === undefined){
    createScheduler(TAT);
  }
  if (process.env.NODE_ENV === 'production' && process.env.SECONDARY_APPLICATION_NAME === TAT) {
    createScheduler(TAT);
    createScheduler('teacherTrainingReport');
  }
});

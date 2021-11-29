import { log, dbConfig } from '../utils';
import db from './db';
import createScheduler from '../utils/createScheduler';
import reRunJobsFromDB from '../utils/scheduleJobs/reRunJobsFromDB';
import sendDemoCompletionCertificate from './autoGenerate/graphql/postHookFunctions/utils/sendDemoCompletionCertificate';

let dbReconnectCount = 1;
db.on('error', (err) => {
  log(`Failed to connect to DB. Error being ${err}`);
  if (err.message && err.message.match(/failed to connect to server .* on first connect/)) {
    // Wait for a bit, then try to connect again
    setTimeout(() => {
      log(`Retry count ${dbReconnectCount}. Reconnecting to DB`);
      dbReconnectCount += 1;
      db.openUri(dbConfig.dbUri);
    }, 5 * 1000);
  }
}).on('reconnected', () => {
  log('MongoDB reconnected!');
}).on('disconnected', () => {
  log('MongoDB disconnected!');
}).once('open', async () => {
  log('Connected to DB.');
  // sendDemoCompletionCertificate('ckwex07n800003jinddynfed1', 'cjs8skrd200041huzz78kncz5');
  if (
    process.env.NODE_ENV === 'production'
    && process.env.IS_SCHEDULER_INSTANCE
    && process.env.IS_SCHEDULER_INSTANCE !== 'false') {
    createScheduler('mentorReport');
    createScheduler('sessionReport');
    createScheduler('sessionCourseReport');
    reRunJobsFromDB();
  }
});

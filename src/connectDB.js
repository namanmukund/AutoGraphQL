import * as schedule from 'node-schedule';
import { log, dbConfig } from '../utils';
import db from './db';
import scheduleTrialSessionReminder from '../utils/scheduleJobs/scheduleTrialSessionReminder';

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
  if (
    process.env.NODE_ENV === 'production'
    && process.env.IS_SCHEDULER_INSTANCE
    && process.env.IS_SCHEDULER_INSTANCE !== 'false') {
    // eslint-disable-next-line no-unused-vars
    const interval = 30;
    const rule = new schedule.RecurrenceRule();
    rule.minute = interval;
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-unused-vars
    await scheduleTrialSessionReminder();
    schedule.scheduleJob(rule, async () => {
      // eslint-disable-next-line no-console
      await scheduleTrialSessionReminder();
    });
  }
});

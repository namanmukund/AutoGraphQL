import * as schedule from 'node-schedule';
import { log, dbConfig } from '../utils';
import db from './db';
import scheduleTrialSessionReminder from '../utils/scheduleJobs/scheduleTrialSessionReminder';
import getRandomNumber from '../utils/getRandomNumber';

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
  if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line no-unused-vars
    const rand = getRandomNumber(20, 60);
    const scheduleConfig = `*/${rand} * * * *`;
    // eslint-disable-next-line no-unused-vars
    const j = schedule.scheduleJob(scheduleConfig, async () => {
      // eslint-disable-next-line no-console
      await scheduleTrialSessionReminder();
    });
  }
});

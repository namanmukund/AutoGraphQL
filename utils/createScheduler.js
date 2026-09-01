import * as schedule from 'node-schedule';
import deleteUserBlacklistedTokens from './scheduleJobs/deleteUserBlacklistedTokens';

const createScheduler = (schedulerName) => {
  const rule = new schedule.RecurrenceRule();
  switch (schedulerName) {
    case 'autoDeleteBlacklistedTokens':
      rule.minute = 0;
      rule.hour = 10;
      rule.dayOfWeek = 0;
      schedule.scheduleJob(rule, async () => {
        await deleteUserBlacklistedTokens();
      });
      break;
    default:
  }
  return true;
};

export default createScheduler;

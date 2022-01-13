import * as schedule from 'node-schedule';
import scheduleTrialSessionReminder from './scheduleJobs/scheduleTrialSessionReminder';
import scheduleMentorReport from './scheduleJobs/scheduleMentorReport';
import scheduleSessionReport from './scheduleJobs/scheduleSessionReport';
import scheduleSessionCourseReport from './scheduleJobs/scheduleCourseReport';
import scheduleB2BSessionReminder from './scheduleJobs/scheduleB2BSessionReminder';
import scheduleB2BSessionMissed from './scheduleJobs/scheduleB2BSessionMissed';
// eslint-disable-next-line no-unused-vars
import scheduleB2BSessionHomeworkRemainder from './scheduleJobs/scheduleB2BSessionHomeworkRemainder';
// create scheduler for different functionalities
const createScheduler = (schedulerName) => {
  // eslint-disable-next-line no-unused-vars
  const rule = new schedule.RecurrenceRule();
  switch (schedulerName) {
    case 'sessionReminder':
      rule.minute = 30;
      // eslint-disable-next-line no-unused-vars
      schedule.scheduleJob(rule, async () => {
        // eslint-disable-next-line no-console
        console.log('scheduler started for: ', schedulerName);
        await scheduleTrialSessionReminder();
      });
      break;
    case 'b2bSessionReminder':
      rule.minute = 20;
      // eslint-disable-next-line no-unused-vars
      schedule.scheduleJob(rule, async () => {
        // eslint-disable-next-line no-console
        console.log('scheduler started for: ', schedulerName);
        await scheduleB2BSessionReminder();
      });
      break;
    case 'b2bHomeworkMissed':
      rule.minute = 40;
      // eslint-disable-next-line no-unused-vars
      schedule.scheduleJob(rule, async () => {
        // eslint-disable-next-line no-console
        console.log('scheduler started for: ', schedulerName);
        await scheduleB2BHomeworkMissed();
      });
      break;
    case 'b2bSessionMissed':
      rule.minute = 50;
      // eslint-disable-next-line no-unused-vars
      schedule.scheduleJob(rule, async () => {
        // eslint-disable-next-line no-console
        console.log('scheduler started for: ', schedulerName);
        await scheduleB2BSessionMissed();
      });
      break;
    case 'mentorReport':
      rule.hour = 10;
      rule.minute = 32;
      rule.second = 0;
      rule.dayOfWeek = new schedule.Range(0, 6);
      // eslint-disable-next-line no-unused-vars
      schedule.scheduleJob(rule, async () => {
        // eslint-disable-next-line no-console
        console.log('scheduler started for: ', schedulerName);
        await scheduleMentorReport();
      });
      break;
    case 'sessionReport':
      rule.tz = 'Asia/Kolkata';
      rule.hour = 1;
      rule.minute = 0;
      rule.second = 0;
      rule.dayOfWeek = new schedule.Range(0, 6);
      // eslint-disable-next-line no-unused-vars
      schedule.scheduleJob(rule, async () => {
        // eslint-disable-next-line no-console
        console.log('scheduler started for: ', schedulerName);
        await scheduleSessionReport(5);
      });
      break;
    case 'sessionCourseReport':
      rule.tz = 'Asia/Kolkata';
      rule.hour = 3;
      rule.minute = 0;
      rule.second = 0;
      rule.dayOfWeek = new schedule.Range(0, 6);
      // eslint-disable-next-line no-unused-vars
      schedule.scheduleJob(rule, async () => {
        // eslint-disable-next-line no-console
        console.log('scheduler started for: ', schedulerName);
        await scheduleSessionCourseReport(2);
      });
      break;
    default:
  }
  return true;
};

export default createScheduler;

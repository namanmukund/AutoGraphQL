import * as schedule from 'node-schedule';
// import scheduleTrialSessionReminder from './scheduleJobs/scheduleTrialSessionReminder';
import scheduleMentorReport from './scheduleJobs/scheduleMentorReport';
// import scheduleSessionReport from './scheduleJobs/scheduleSessionReport';
// import scheduleSessionCourseReport from './scheduleJobs/scheduleCourseReport';
// import scheduleB2BSessionReminder from './scheduleJobs/scheduleB2BSessionReminder';
// import scheduleB2BSessionHomeworkRemainder from './scheduleJobs/scheduleB2BSessionHomeworkRemainder';
// import scheduleEventSessionRemainder from './scheduleJobs/scheduleEventSessionRemainder';
import scheduleBatchSessionOtpGenerator from './scheduleJobs/secheduleBatchSessionOtpGenerator';
// import scheduleUpdateLeadSource from './scheduleJobs/scheduleUpdateLeadSource';
import scheduleUpdateTheoryClassStatus from './scheduleJobs/scheduleUpdateTheoryClassStatus';
import scheduleB2cBatchSessionReport from './scheduleJobs/scheduleB2cBatchSessionReport';
import deleteUserBlacklistedTokens from './scheduleJobs/deleteUserBlacklistedTokens';
import batchAndUpdateUserSessionReports from './scheduleJobs/jobs/batchAndUpdateUserSessionReports';
import { TAT } from '../constants';
import scheduleTeacherTrainingReports from './scheduleJobs/jobs/scheduleTeacherTrainingReports';

// create scheduler for different functionalities
const createScheduler = (schedulerName) => {
  // eslint-disable-next-line no-unused-vars
  const rule = new schedule.RecurrenceRule();
  switch (schedulerName) {
    // case 'sessionReminder':
    //   rule.minute = 30;
    //   // eslint-disable-next-line no-unused-vars
    //   schedule.scheduleJob(rule, async () => {
    //     // eslint-disable-next-line no-console
    //     console.log('scheduler started for: ', schedulerName);
    //     await scheduleTrialSessionReminder();
    //   });
    //   break;
    // case 'b2bSessionReminder':
    //   rule.minute = 20;
    //   // eslint-disable-next-line no-unused-vars
    //   schedule.scheduleJob(rule, async () => {
    //     // eslint-disable-next-line no-console
    //     console.log('scheduler started for: ', schedulerName);
    //     await scheduleB2BSessionReminder();
    //   });
    //   break;
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
    // case 'sessionReport':
    //   rule.tz = 'Asia/Kolkata';
    //   rule.hour = 1;
    //   rule.minute = 0;
    //   rule.second = 0;
    //   rule.dayOfWeek = new schedule.Range(0, 6);
    //   // eslint-disable-next-line no-unused-vars
    //   schedule.scheduleJob(rule, async () => {
    //     // eslint-disable-next-line no-console
    //     console.log('scheduler started for: ', schedulerName);
    //     await scheduleSessionReport(5);
    //   });
    //   break;
    // case 'sessionCourseReport':
    //   rule.tz = 'Asia/Kolkata';
    //   rule.hour = 3;
    //   rule.minute = 0;
    //   rule.second = 0;
    //   rule.dayOfWeek = new schedule.Range(0, 6);
    //   // eslint-disable-next-line no-unused-vars
    //   schedule.scheduleJob(rule, async () => {
    //     // eslint-disable-next-line no-console
    //     console.log('scheduler started for: ', schedulerName);
    //     await scheduleSessionCourseReport(2);
    //   });
    //   break;
    // case 'b2bSessionHomeworkRemainder':
    //   rule.tz = 'Asia/Kolkata';
    //   rule.minute = 50;
    //   rule.dayOfWeek = new schedule.Range(0, 6);
    //   // eslint-disable-next-line no-unused-vars
    //   schedule.scheduleJob(rule, async () => {
    //     // eslint-disable-next-line no-console
    //     console.log('scheduler started for: ', schedulerName);
    //     await scheduleB2BSessionHomeworkRemainder();
    //   });
    //   break;
    // case 'eventSessionRemainder':
    //   rule.tz = 'Asia/Kolkata';
    //   rule.minute = 5;
    //   rule.dayOfWeek = new schedule.Range(0, 6);
    //   // eslint-disable-next-line no-unused-vars
    //   schedule.scheduleJob(rule, async () => {
    //     // eslint-disable-next-line no-console
    //     console.log('scheduler started for: ', schedulerName);
    //     await scheduleEventSessionRemainder();
    //   });
    //   break;
    case 'batchSessionOtpGeneration':
      rule.tz = 'Asia/Kolkata';
      rule.minute = new schedule.Range(0, 59, 20);
      // eslint-disable-next-line no-unused-vars
      schedule.scheduleJob(rule, async () => {
        // eslint-disable-next-line no-console
        console.log('scheduler started for: ', schedulerName);
        await scheduleBatchSessionOtpGenerator();
      });
      break;
    // case 'updateLeadSource':
    //   rule.tz = 'Asia/Kolkata';
    //   rule.hour = 6;
    //   rule.minute = 0;
    //   rule.dayOfWeek = new schedule.Range(0, 6);
    //   // eslint-disable-next-line no-unused-vars
    //   schedule.scheduleJob(rule, async () => {
    //     // eslint-disable-next-line no-console
    //     console.log('scheduler started for: ', schedulerName);
    //     await scheduleUpdateLeadSource();
    //   });
    //   break;
    case 'autoCompleteThoeryClassroomSessions':
      rule.tz = 'Asia/Kolkata';
      rule.hour = 2;
      rule.dayOfWeek = new schedule.Range(0, 6);
      // eslint-disable-next-line no-unused-vars
      schedule.scheduleJob(rule, async () => {
        // eslint-disable-next-line no-console
        console.log('scheduler started for: ', schedulerName);
        await scheduleUpdateTheoryClassStatus();
      });
      break;
    case 'b2cBatchSessionReport':
      rule.tz = 'Asia/Kolkata';
      rule.hour = 3;
      rule.dayOfWeek = new schedule.Range(0, 6);
      // eslint-disable-next-line no-unused-vars
      schedule.scheduleJob(rule, async () => {
        // eslint-disable-next-line no-console
        console.log('scheduler started for: ', schedulerName);
        await scheduleB2cBatchSessionReport();
      });
      break;
    case TAT:
      // eslint-disable-next-line no-console
      rule.tz = 'Asia/Kolkata';
      rule.minute = 0;
      rule.hour = new schedule.Range(0, 23, 4);
      rule.dayOfWeek = new schedule.Range(0, 6);
      schedule.scheduleJob(rule, async () => {
        // eslint-disable-next-line no-console
        console.log('scheduler started for: ', schedulerName);
        await batchAndUpdateUserSessionReports();
      });
      break;
    case 'autoDeleteBlacklistedTokens':
      rule.tz = 'Asia/Kolkata';
      rule.minute = 0;
      rule.hour = 10;
      rule.dayOfWeek = 0;
      schedule.scheduleJob(rule, async () => {
        // eslint-disable-next-line no-console
        console.log('scheduler started for: ', schedulerName);
        await deleteUserBlacklistedTokens();
      });
      break;
    case 'teacherTrainingReport':
      rule.tz = 'Asia/Kolkata';
      rule.minute = 0;
      rule.hour = 22;
      rule.dayOfWeek = new schedule.Range(0, 6);
      schedule.scheduleJob(rule, async () => {
        // eslint-disable-next-line no-console
        console.log('scheduler started for: ', schedulerName);
        await scheduleTeacherTrainingReports();
      });
      break;
    default:
  }
  return true;
};

export default createScheduler;

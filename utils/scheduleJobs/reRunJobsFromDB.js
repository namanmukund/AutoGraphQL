import schedule from 'node-schedule';
import moment from 'moment';
import { get } from 'lodash';
import callLocalGraphqlApi from '../../src/api/callLocalGraphqlApi';
import sendB2B2CBookReminderNextDay from './jobs/sendB2B2CBookReminderNextDay';
import sendB2B2CBookingReminder from './jobs/sendB2B2CBookingReminder';
import extractBatchSessionAndPostCarnival from '../../src/autoGenerate/graphql/postHookFunctions/utils/extractBatchSessionAndSendPostCarnival';

const FETCH_JOBS = `{
  scheduleJobs {
    id
    jobType
    scheduledDate
    parent {
      id
    }
    code
    batchSessionId
  }
}`;

const deleteJob = (id) => `
  mutation {
    deleteScheduleJob(id: "${id}") {
      id
    }
  }
`;

const reRunJobsFromDB = async () => {
  const res = await callLocalGraphqlApi(FETCH_JOBS);
  const scheduledJobs = get(res, 'data.scheduleJobs', []);
  scheduledJobs.forEach(async (scheduledJob) => {
    const {
      jobType, scheduledDate, parent, id, code, batchSessionId,
    } = scheduledJob;
    const isPast = moment().isAfter(scheduledDate);
    const userId = get(parent, 'id');
    switch (jobType) {
      case 'sendNextDayBookReminder': {
        if (isPast) {
          sendB2B2CBookReminderNextDay({ userId: get(parent, 'id'), code }, () => callLocalGraphqlApi(deleteJob(id)));
        } else {
          schedule.scheduleJob(new Date(scheduledDate), () => {
            sendB2B2CBookReminderNextDay({ userId: get(parent, 'id'), code }, () => callLocalGraphqlApi(deleteJob(id)));
          });
        }
        break;
      }
      case 'engagementMail': {
        schedule.scheduleJob(new Date(scheduledDate), () => {
          sendB2B2CBookingReminder({ userId, code, jobType }, () => callLocalGraphqlApi(deleteJob(id)));
        });
        break;
      }
      case 'engagementMailWithMentor': {
        schedule.scheduleJob(new Date(scheduledDate), () => {
          sendB2B2CBookingReminder({ userId, code, jobType }, () => callLocalGraphqlApi(deleteJob(id)));
        });
        break;
      }
      case 'bookingFinalReminder': {
        schedule.scheduleJob(new Date(scheduledDate), () => {
          sendB2B2CBookingReminder({ userId, code, jobType }, () => callLocalGraphqlApi(deleteJob(id)));
        });
        break;
      }
      case 'bookingSameDayFinalReminder': {
        schedule.scheduleJob(new Date(scheduledDate), () => {
          sendB2B2CBookingReminder({ userId, code, jobType }, () => callLocalGraphqlApi(deleteJob(id)));
        });
        break;
      }
      case 'sessionReminderWati': {
        schedule.scheduleJob(new Date(scheduledDate), () => {
          sendB2B2CBookingReminder({ userId, code, jobType }, () => callLocalGraphqlApi(deleteJob(id)));
        });
        break;
      }
      case 'postCarnivalMail': {
        schedule.scheduleJob(new Date(scheduledDate), () => {
          extractBatchSessionAndPostCarnival({ batchSessionId }, () => callLocalGraphqlApi(deleteJob(id)));
        });
        break;
      }
      default:
        break;
    }
  });
};

export default reRunJobsFromDB;

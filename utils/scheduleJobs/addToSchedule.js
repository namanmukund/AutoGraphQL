import { get } from 'lodash';
import schedule from 'node-schedule';
import callLocalGraphqlApi from '../../src/api/callLocalGraphqlApi';
import sendB2B2CBookReminderNextDay from './jobs/sendB2B2CBookReminderNextDay';
import sendB2B2CBookingReminder from './jobs/sendB2B2CBookingReminder';
import sendB2CSessionReminder from './jobs/sendB2CSessionReminder';
import extractBatchSessionAndPostCarnival from '../../src/autoGenerate/graphql/postHookFunctions/utils/extractBatchSessionAndSendPostCarnival';
import sendB2CBookReminderNextDay from './jobs/sendB2CBookReminderNextDay';

const addScheduleJob = ({
  jobType, userId, scheduledDate, code, batchSessionId, menteeSessionId,
}) => `
  mutation {
    addScheduleJob(
      input: {
        jobType: "${jobType}"
        ${code ? `code: "${code}"` : ''}
        ${batchSessionId ? `batchSessionId: "${batchSessionId}"` : ''}
        ${menteeSessionId ? `menteeSessionId: "${menteeSessionId}"` : ''}
        scheduledDate: "${scheduledDate.toISOString()}"
      }
      ${userId ? `parentConnectId: "${userId}"` : ''}
    ) {
      id
    }
  }
`;

const deleteJob = (id) => `
  mutation {
    deleteScheduleJob(id: "${id}") {
      id
    }
  }
`;

const addToSchedule = async (jobType, scheduledDate, {
  userId,
  code,
  batchSessionId,
  menteeId: menteeSessionId,
}) => {
  switch (jobType) {
    case 'sendNextDayBookReminder': {
      const res = await callLocalGraphqlApi(addScheduleJob({
        jobType, userId, scheduledDate, code,
      }));
      const jobId = get(res, 'data.addScheduleJob.id');
      schedule.scheduleJob(scheduledDate, () => {
        sendB2B2CBookReminderNextDay({ userId, code }, () => callLocalGraphqlApi(deleteJob(jobId)));
      });
      break;
    }
    case 'sendB2CBookReminderNextDay': {
      const res = await callLocalGraphqlApi(addScheduleJob({
        jobType, userId, scheduledDate,
      }));
      const jobId = get(res, 'data.addScheduleJob.id');
      schedule.scheduleJob(scheduledDate, () => {
        sendB2CBookReminderNextDay({ userId, code }, () => callLocalGraphqlApi(deleteJob(jobId)));
      });
      break;
    }
    case 'engagementMail': {
      const res = await callLocalGraphqlApi(addScheduleJob({
        jobType, userId, scheduledDate, code,
      }));
      const jobId = get(res, 'data.addScheduleJob.id');
      schedule.scheduleJob(scheduledDate, () => {
        sendB2B2CBookingReminder({ userId, code, jobType }, () => callLocalGraphqlApi(deleteJob(jobId)));
      });
      break;
    }
    case 'engagementMailWithMentor': {
      const res = await callLocalGraphqlApi(addScheduleJob({
        jobType, userId, scheduledDate, code,
      }));
      const jobId = get(res, 'data.addScheduleJob.id');
      schedule.scheduleJob(scheduledDate, () => {
        sendB2B2CBookingReminder({ userId, code, jobType }, () => callLocalGraphqlApi(deleteJob(jobId)));
      });
      break;
    }
    case 'bookingFinalReminder': {
      const res = await callLocalGraphqlApi(addScheduleJob({
        jobType, userId, scheduledDate, code,
      }));
      const jobId = get(res, 'data.addScheduleJob.id');
      schedule.scheduleJob(scheduledDate, () => {
        sendB2B2CBookingReminder({ userId, code, jobType }, () => callLocalGraphqlApi(deleteJob(jobId)));
      });
      break;
    }
    case 'bookingSameDayFinalReminder': {
      const res = await callLocalGraphqlApi(addScheduleJob({
        jobType, userId, scheduledDate, code,
      }));
      const jobId = get(res, 'data.addScheduleJob.id');
      schedule.scheduleJob(scheduledDate, () => {
        sendB2B2CBookingReminder({ userId, code, jobType }, () => callLocalGraphqlApi(deleteJob(jobId)));
      });
      break;
    }
    case 'sessionReminderWati': {
      const res = await callLocalGraphqlApi(addScheduleJob({
        jobType, userId, scheduledDate, code,
      }));
      const jobId = get(res, 'data.addScheduleJob.id');
      schedule.scheduleJob(scheduledDate, () => {
        sendB2B2CBookingReminder({ userId, code, jobType }, () => callLocalGraphqlApi(deleteJob(jobId)));
      });
      break;
    }
    case 'postCarnivalMail': {
      const res = await callLocalGraphqlApi(addScheduleJob({
        jobType, batchSessionId, scheduledDate,
      }));
      const jobId = get(res, 'data.addScheduleJob.id');
      extractBatchSessionAndPostCarnival({ jobType, batchSessionId }, () => {}, true);
      schedule.scheduleJob(scheduledDate, () => {
        extractBatchSessionAndPostCarnival({ jobType, batchSessionId }, () => callLocalGraphqlApi(deleteJob(jobId)));
      });
      break;
    }
    case 'B2CEngagementMail': {
      const res = await callLocalGraphqlApi(addScheduleJob({
        jobType, menteeSessionId, scheduledDate,
      }));
      const jobId = get(res, 'data.addScheduleJob.id');
      schedule.scheduleJob(scheduledDate, () => {
        sendB2CSessionReminder({ userId, jobType, menteeSessionId }, () => callLocalGraphqlApi(deleteJob(jobId)));
      });
      break;
    }
    case 'B2CEngagementMailWithMentor': {
      const res = await callLocalGraphqlApi(addScheduleJob({
        jobType, menteeSessionId, scheduledDate,
      }));
      const jobId = get(res, 'data.addScheduleJob.id');
      schedule.scheduleJob(scheduledDate, () => {
        sendB2CSessionReminder({ userId, jobType, menteeSessionId }, () => callLocalGraphqlApi(deleteJob(jobId)));
      });
      break;
    }
    case 'B2CBookingFinalReminder': {
      const res = await callLocalGraphqlApi(addScheduleJob({
        jobType, menteeSessionId, scheduledDate,
      }));
      const jobId = get(res, 'data.addScheduleJob.id');
      schedule.scheduleJob(scheduledDate, () => {
        sendB2CSessionReminder({ userId, jobType, menteeSessionId }, () => callLocalGraphqlApi(deleteJob(jobId)));
      });
      break;
    }
    case 'B2CBookingSameDayFinalReminder': {
      const res = await callLocalGraphqlApi(addScheduleJob({
        jobType, menteeSessionId, scheduledDate,
      }));
      const jobId = get(res, 'data.addScheduleJob.id');
      schedule.scheduleJob(scheduledDate, () => {
        sendB2CSessionReminder({ userId, jobType, menteeSessionId }, () => callLocalGraphqlApi(deleteJob(jobId)));
      });
      break;
    }
    case 'B2CSessionReminderWati': {
      const res = await callLocalGraphqlApi(addScheduleJob({
        jobType, menteeSessionId, scheduledDate,
      }));
      const jobId = get(res, 'data.addScheduleJob.id');
      schedule.scheduleJob(scheduledDate, () => {
        sendB2CSessionReminder({ userId, jobType, menteeSessionId }, () => callLocalGraphqlApi(deleteJob(jobId)));
      });
      break;
    }
    default:
      break;
  }
};

export default addToSchedule;

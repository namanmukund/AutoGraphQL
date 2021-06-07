import { get } from 'lodash';
import schedule from 'node-schedule';
import callLocalGraphqlApi from '../../src/api/callLocalGraphqlApi';
import sendB2BBookReminderNextDay from './jobs/sendB2BBookReminderNextDay';
import sendB2BBookingReminder from './jobs/sendB2BBookingReminder';
import extractBatchSessionAndPostCarnival from '../../src/autoGenerate/graphql/postHookFunctions/utils/extractBatchSessionAndSendPostCarnival';

const addScheduleJob = ({
  jobType, userId, scheduledDate, code, batchSessionId,
}) => `
  mutation {
    addScheduleJob(
      input: {
        jobType: "${jobType}"
        ${code ? `code: "${code}"` : ''}
        ${batchSessionId ? `batchSessionId: "${batchSessionId}"` : ''}
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
}) => {
  switch (jobType) {
    case 'sendNextDayBookReminder': {
      const res = await callLocalGraphqlApi(addScheduleJob({
        jobType, userId, scheduledDate, code,
      }));
      const jobId = get(res, 'data.addScheduleJob.id');
      schedule.scheduleJob(scheduledDate, () => {
        sendB2BBookReminderNextDay({ userId, code }, () => callLocalGraphqlApi(deleteJob(jobId)));
      });
      break;
    }
    case 'engagementMail': {
      const res = await callLocalGraphqlApi(addScheduleJob({
        jobType, userId, scheduledDate, code,
      }));
      const jobId = get(res, 'data.addScheduleJob.id');
      schedule.scheduleJob(scheduledDate, () => {
        sendB2BBookingReminder({ userId, code, jobType }, () => callLocalGraphqlApi(deleteJob(jobId)));
      });
      break;
    }
    case 'engagementMailWithMentor': {
      const res = await callLocalGraphqlApi(addScheduleJob({
        jobType, userId, scheduledDate, code,
      }));
      const jobId = get(res, 'data.addScheduleJob.id');
      schedule.scheduleJob(scheduledDate, () => {
        sendB2BBookingReminder({ userId, code, jobType }, () => callLocalGraphqlApi(deleteJob(jobId)));
      });
      break;
    }
    case 'bookingFinalReminder': {
      const res = await callLocalGraphqlApi(addScheduleJob({
        jobType, userId, scheduledDate, code,
      }));
      const jobId = get(res, 'data.addScheduleJob.id');
      schedule.scheduleJob(scheduledDate, () => {
        sendB2BBookingReminder({ userId, code, jobType }, () => callLocalGraphqlApi(deleteJob(jobId)));
      });
      break;
    }
    case 'bookingSameDayFinalReminder': {
      const res = await callLocalGraphqlApi(addScheduleJob({
        jobType, userId, scheduledDate, code,
      }));
      const jobId = get(res, 'data.addScheduleJob.id');
      schedule.scheduleJob(scheduledDate, () => {
        sendB2BBookingReminder({ userId, code, jobType }, () => callLocalGraphqlApi(deleteJob(jobId)));
      });
      break;
    }
    case 'sessionReminderWati': {
      const res = await callLocalGraphqlApi(addScheduleJob({
        jobType, userId, scheduledDate, code,
      }));
      const jobId = get(res, 'data.addScheduleJob.id');
      schedule.scheduleJob(scheduledDate, () => {
        sendB2BBookingReminder({ userId, code, jobType }, () => callLocalGraphqlApi(deleteJob(jobId)));
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
    default:
      break;
  }
};

export default addToSchedule;

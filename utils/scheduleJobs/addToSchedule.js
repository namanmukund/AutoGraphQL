import { get } from 'lodash';
import schedule from 'node-schedule';
import callLocalGraphqlApi from '../../src/api/callLocalGraphqlApi';
// import sendB2B2CBookReminderNextDay from './jobs/sendB2B2CBookReminderNextDay';
// import sendB2B2CBookingReminder from './jobs/sendB2B2CBookingReminder';
// import sendB2CSessionReminder from './jobs/sendB2CSessionReminder';
import extractBatchSessionAndPostCarnival from '../../src/autoGenerate/graphql/postHookFunctions/utils/extractBatchSessionAndSendPostCarnival';
import scheduleB2BSessionHomeworkRemainder from './scheduleB2BSessionHomeworkRemainder';
import scheduleB2BSessionReminder from './scheduleB2BSessionReminder';
// import sendB2CBookReminderNextDay from './jobs/sendB2CBookReminderNextDay';
// import sendMentorSessionReminder from './jobs/sendMentorSessionReminder';
// import sendMentorSessionReminderB2B2C from './jobs/sendMentorSessionReminderB2B2C';
import sendMentorVerifyBookingReminder from './jobs/sendMentorVerifyBookingReminder';
import sendEventCommunication from './jobs/sendEventCommunication';
import eventNewRegistrationReminder from './jobs/eventNewRegistrationReminder';
import addStudentToEventSession from './jobs/addStudentsToEventSession';

const getScheduleJobAndDelete = async (eventSessionId) => {
  const query = `{
  scheduleJobs(filter: { eventSessionId: "${eventSessionId}" }) {
    id
  }
}
`;
  const scheduleJob = await callLocalGraphqlApi(query);
  if (get(scheduleJob, 'data.scheduleJobs', []).length) {
    const deleteQuery = `mutation {
    deleteScheduleJob(id: "${get(get(scheduleJob, 'data.scheduleJobs[0].id'))}") {
      id
    }
  }
  `;
    await callLocalGraphqlApi(deleteQuery);
  }
};

const addScheduleJob = ({
  jobType,
  userId,
  scheduledDate,
  code,
  menteeSessionId,
  menteeSessionUpdatedAt,
  menteeId,
  mentorMenteeSessionId,
  batchSessionId,
  courseName,
  batchCode,
  schoolName,
  sessionDate,
  sessionTime,
  sessionLink,
  mentorUserId,
  mentorPhoneNumber,
  taskId,
  studentProfileId,
  templateName,
  isEmailRule = false,
  commsVariables,
  eventId,
  condition,
  attendanceFilter,
  value,
  unit,
  eventSessionId,
}) => `
  mutation {
    addScheduleJob(
      input: {
        jobType: "${jobType}"
        ${code ? `code: "${code}"` : ''}
        ${batchSessionId ? `batchSessionId: "${batchSessionId}"` : ''}
        ${menteeSessionId ? `menteeSessionId: "${menteeSessionId}"` : ''}
        ${menteeId ? `menteeId: "${menteeId}"` : ''}
        ${menteeSessionUpdatedAt ? `menteeSessionUpdatedAt: "${menteeSessionUpdatedAt}"` : ''}
        ${mentorMenteeSessionId ? `mentorMenteeSessionId: "${mentorMenteeSessionId}"` : ''}
        ${courseName ? `courseName: "${courseName}"` : ''}
        ${batchCode ? `batchCode: "${batchCode}"` : ''}
        ${schoolName ? `schoolName: "${schoolName}"` : ''}
        ${sessionDate ? `sessionDate: "${sessionDate}"` : ''}
        ${sessionTime ? `sessionTime: "${sessionTime}"` : ''}
        ${sessionLink ? `sessionLink: "${sessionLink}"` : ''}
        ${mentorUserId ? `mentorUserId: "${mentorUserId}"` : ''}
        ${taskId ? `taskId: "${taskId}"` : ''}
        ${mentorPhoneNumber ? `mentorPhoneNumber: "${mentorPhoneNumber}"` : ''}
        scheduledDate: "${scheduledDate.toISOString()}"
        ${studentProfileId ? `studentProfileId:"${studentProfileId}"` : ''}
        ${commsVariables ? `commsVariables: ${commsVariables}` : ''}
        ${templateName ? `templateName: "${templateName}"` : ''}
        ${isEmailRule ? 'isEmailRule: true' : ''}
        ${eventId ? `eventId: "${eventId}"` : ''}
        ${condition ? `condition: ${condition}` : ''}
        ${attendanceFilter ? `attendanceFilter: ${attendanceFilter}` : ''}
        ${value ? `value: ${value}` : ''}
        ${unit ? `unit: ${unit}` : ''}
        ${eventSessionId ? `eventSessionId: "${eventSessionId}"` : ''}
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
  // userId,
  // code,
  batchSessionId,
  // menteeId: menteeSessionId,
  // menteeSessionUpdatedAt,
  // mentorMenteeSessionId,
  // courseName,
  // batchCode,
  // schoolName,
  // sessionDate,
  // sessionTime,
  // sessionLink,
  mentorUserId,
  // mentorPhoneNumber,
  taskId,
  studentProfileId,
  eventId,
  eventCommsRule,
  eventSessionId,
  isUpdatingEventSession = false,
}) => {
  switch (jobType) {
    case 'sendNextDayBookReminder': {
      // const res = await callLocalGraphqlApi(addScheduleJob({
      //   jobType, userId, scheduledDate, code,
      // }));
      // const jobId = get(res, 'data.addScheduleJob.id');
      // schedule.scheduleJob(scheduledDate, () => {
      //   sendB2B2CBookReminderNextDay({ userId, code }, () => callLocalGraphqlApi(deleteJob(jobId)));
      // });
      break;
    }
    case 'sendB2BReminder': {
      const res = await callLocalGraphqlApi(addScheduleJob({
        jobType, scheduledDate, batchSessionId,
      }));
      const jobId = get(res, 'data.addScheduleJob.id');
      schedule.scheduleJob(scheduledDate, () => {
        scheduleB2BSessionReminder(batchSessionId, deleteJob(jobId));
      });
      break;
    }
    case 'sendB2BHomeworkReminder': {
      const res = await callLocalGraphqlApi(addScheduleJob({
        jobType, scheduledDate, batchSessionId,
      }));
      const jobId = get(res, 'data.addScheduleJob.id');
      schedule.scheduleJob(scheduledDate, () => {
        scheduleB2BSessionHomeworkRemainder(batchSessionId, deleteJob(jobId));
      });
      break;
    }
    case 'sendB2CBookReminderNextDay': {
      // const res = await callLocalGraphqlApi(addScheduleJob({
      //   jobType, userId, scheduledDate,
      // }));
      // const jobId = get(res, 'data.addScheduleJob.id');
      // schedule.scheduleJob(scheduledDate, () => {
      //   sendB2CBookReminderNextDay({ userId, code }, () => callLocalGraphqlApi(deleteJob(jobId)));
      // });
      break;
    }
    case 'engagementMail': {
      // const res = await callLocalGraphqlApi(addScheduleJob({
      //   jobType, userId, scheduledDate, code,
      // }));
      // const jobId = get(res, 'data.addScheduleJob.id');
      // schedule.scheduleJob(scheduledDate, () => {
      //   sendB2B2CBookingReminder({ userId, code, jobType }, () => callLocalGraphqlApi(deleteJob(jobId)));
      // });
      break;
    }
    case 'engagementMailWithMentor': {
      // const res = await callLocalGraphqlApi(addScheduleJob({
      //   jobType, userId, scheduledDate, code,
      // }));
      // const jobId = get(res, 'data.addScheduleJob.id');
      // schedule.scheduleJob(scheduledDate, () => {
      //   sendB2B2CBookingReminder({ userId, code, jobType }, () => callLocalGraphqlApi(deleteJob(jobId)));
      // });
      break;
    }
    case 'bookingFinalReminder': {
      // const res = await callLocalGraphqlApi(addScheduleJob({
      //   jobType, userId, scheduledDate, code,
      // }));
      // const jobId = get(res, 'data.addScheduleJob.id');
      // schedule.scheduleJob(scheduledDate, () => {
      //   sendB2B2CBookingReminder({ userId, code, jobType }, () => callLocalGraphqlApi(deleteJob(jobId)));
      // });
      break;
    }
    case 'bookingSameDayFinalReminder': {
      // const res = await callLocalGraphqlApi(addScheduleJob({
      //   jobType, userId, scheduledDate, code,
      // }));
      // const jobId = get(res, 'data.addScheduleJob.id');
      // schedule.scheduleJob(scheduledDate, () => {
      //   sendB2B2CBookingReminder({ userId, code, jobType }, () => callLocalGraphqlApi(deleteJob(jobId)));
      // });
      break;
    }
    case 'sessionReminderWati': {
      // const res = await callLocalGraphqlApi(addScheduleJob({
      //   jobType, userId, scheduledDate, code,
      // }));
      // const jobId = get(res, 'data.addScheduleJob.id');
      // schedule.scheduleJob(scheduledDate, () => {
      //   sendB2B2CBookingReminder({ userId, code, jobType }, () => callLocalGraphqlApi(deleteJob(jobId)));
      // });
      break;
    }
    case 'postCarnivalMail': {
      // const res = await callLocalGraphqlApi(addScheduleJob({
      //   jobType, batchSessionId, scheduledDate,
      // }));
      // const jobId = get(res, 'data.addScheduleJob.id');
      extractBatchSessionAndPostCarnival({ jobType, batchSessionId }, () => {}, true);
      // schedule.scheduleJob(scheduledDate, () => {
      //   extractBatchSessionAndPostCarnival({ jobType, batchSessionId }, () => callLocalGraphqlApi(deleteJob(jobId)));
      // });
      break;
    }
    case 'B2CEngagementMail': {
      // const res = await callLocalGraphqlApi(addScheduleJob({
      //   jobType, menteeSessionId, menteeSessionUpdatedAt, scheduledDate, menteeId: userId,
      // }));
      // const jobId = get(res, 'data.addScheduleJob.id');
      // schedule.scheduleJob(scheduledDate, () => {
      //   sendB2CSessionReminder({
      //     userId, jobType, menteeSessionId, menteeSessionUpdatedAt,
      //   }, () => callLocalGraphqlApi(deleteJob(jobId)));
      // });
      break;
    }
    case 'B2CEngagementMailWithMentor': {
      // const res = await callLocalGraphqlApi(addScheduleJob({
      //   jobType, menteeSessionId, menteeSessionUpdatedAt, scheduledDate, menteeId: userId,
      // }));
      // const jobId = get(res, 'data.addScheduleJob.id');
      // schedule.scheduleJob(scheduledDate, () => {
      //   sendB2CSessionReminder({
      //     userId, jobType, menteeSessionId, menteeSessionUpdatedAt,
      //   }, () => callLocalGraphqlApi(deleteJob(jobId)));
      // });
      break;
    }
    case 'B2CBookingFinalReminder': {
      // const res = await callLocalGraphqlApi(addScheduleJob({
      //   jobType, menteeSessionId, menteeSessionUpdatedAt, scheduledDate, menteeId: userId,
      // }));
      // const jobId = get(res, 'data.addScheduleJob.id');
      // schedule.scheduleJob(scheduledDate, () => {
      //   sendB2CSessionReminder({
      //     userId, jobType, menteeSessionId, menteeSessionUpdatedAt,
      //   }, () => callLocalGraphqlApi(deleteJob(jobId)));
      // });
      break;
    }
    case 'B2CBookingSameDayFinalReminder': {
      // const res = await callLocalGraphqlApi(addScheduleJob({
      //   jobType, menteeSessionId, menteeSessionUpdatedAt, scheduledDate, menteeId: userId,
      // }));
      // const jobId = get(res, 'data.addScheduleJob.id');
      // schedule.scheduleJob(scheduledDate, () => {
      //   sendB2CSessionReminder({
      //     userId, jobType, menteeSessionId, menteeSessionUpdatedAt,
      //   }, () => callLocalGraphqlApi(deleteJob(jobId)));
      // });
      break;
    }
    case 'B2CSessionReminderWati': {
      // const res = await callLocalGraphqlApi(addScheduleJob({
      //   jobType, menteeSessionId, menteeSessionUpdatedAt, scheduledDate, menteeId: userId,
      // }));
      // const jobId = get(res, 'data.addScheduleJob.id');
      // schedule.scheduleJob(scheduledDate, () => {
      //   sendB2CSessionReminder({
      //     userId, jobType, menteeSessionId, menteeSessionUpdatedAt,
      //   }, () => callLocalGraphqlApi(deleteJob(jobId)));
      // });
      break;
    }
    case 'mentorSessionNotificationB2C': {
      // const res = await callLocalGraphqlApi(addScheduleJob({
      //   jobType, mentorMenteeSessionId, scheduledDate,
      // }));
      // const jobId = get(res, 'data.addScheduleJob.id');
      // schedule.scheduleJob(scheduledDate, () => {
      //   sendMentorSessionReminder({
      //     mentorMenteeSessionId, jobType,
      //   }, () => callLocalGraphqlApi(deleteJob(jobId)));
      // });
      break;
    }
    case 'mentorSessionNotificationB2B2C': {
      // const res = await callLocalGraphqlApi(addScheduleJob({
      //   jobType,
      //   scheduledDate,
      //   batchSessionId,
      //   courseName,
      //   batchCode,
      //   schoolName,
      //   sessionDate,
      //   sessionTime,
      //   sessionLink,
      //   mentorPhoneNumber,
      //   mentorUserId,
      // }));
      // const jobId = get(res, 'data.addScheduleJob.id');
      // schedule.scheduleJob(scheduledDate, () => {
      //   sendMentorSessionReminderB2B2C({
      //     jobType,
      //     batchSessionId,
      //     courseName,
      //     batchCode,
      //     schoolName,
      //     sessionDate,
      //     sessionTime,
      //     sessionLink,
      //     mentorUserId,
      //     mentorPhoneNumber,
      //   }, () => callLocalGraphqlApi(deleteJob(jobId)));
      // });
      break;
    }
    case 'sendMentorVerifyBookingReminder': {
      const res = await callLocalGraphqlApi(addScheduleJob({
        jobType, mentorUserId, taskId, scheduledDate,
      }));
      const jobId = get(res, 'data.addScheduleJob.id');
      schedule.scheduleJob(scheduledDate, () => {
        sendMentorVerifyBookingReminder({
          taskId, mentorUserId, jobType,
        }, () => callLocalGraphqlApi(deleteJob(jobId)));
      });
      break;
    }
    case 'eventCommsJob': {
      let commsVariables = '';
      get(eventCommsRule, 'commsVariables', []).forEach((comms) => {
        if (get(comms, 'dataField')) {
          commsVariables += `{
            whatsappVariableName: "${get(comms, 'whatsappVariableName') || ''}",
            emailVariableName: "${get(comms, 'emailVariableName') || ''}",
            dataField: ${get(comms, 'dataField')}
          },`;
        }
      });
      commsVariables = `[${commsVariables}]`;
      const res = await callLocalGraphqlApi(addScheduleJob({
        jobType,
        eventId,
        scheduledDate,
        templateName: get(eventCommsRule, 'templateName'),
        isEmailRule: get(eventCommsRule, 'isEmailRule', false),
        commsVariables,
        condition: get(eventCommsRule, 'condition'),
        attendanceFilter: get(eventCommsRule, 'attendanceFilter'),
        value: get(eventCommsRule, 'value'),
        unit: get(eventCommsRule, 'unit'),
      }));
      const jobId = get(res, 'data.addScheduleJob.id');
      schedule.scheduleJob(new Date(scheduledDate), () => {
        sendEventCommunication({
          eventId,
          eventCommsRule,
          jobType,
          commsVariables: get(eventCommsRule, 'commsVariables', []),
          templateName: get(eventCommsRule, 'templateName'),
          isEmailRule: get(eventCommsRule, 'isEmailRule', false),
          condition: get(eventCommsRule, 'condition'),
          attendanceFilter: get(eventCommsRule, 'attendanceFilter'),
          value: get(eventCommsRule, 'value'),
          unit: get(eventCommsRule, 'unit'),
        }, () => callLocalGraphqlApi(deleteJob(jobId)));
      });
      break;
    }
    case 'eventNewRegistrationReminder': {
      let commsVariables = '';
      get(eventCommsRule, 'commsVariables', []).forEach((comms) => {
        if (get(comms, 'dataField')) {
          commsVariables += `{
            whatsappVariableName: "${get(comms, 'whatsappVariableName') || ''}",
            emailVariableName: "${get(comms, 'emailVariableName') || ''}",
            dataField: ${get(comms, 'dataField')}
          },`;
        }
      });
      commsVariables = `[${commsVariables}]`;
      const res = await callLocalGraphqlApi(addScheduleJob({
        jobType,
        eventId,
        scheduledDate,
        commsVariables,
        studentProfileId,
        templateName: get(eventCommsRule, 'templateName'),
        isEmailRule: get(eventCommsRule, 'isEmailRule', false),
      }));
      const jobId = get(res, 'data.addScheduleJob.id');
      schedule.scheduleJob(new Date(scheduledDate), () => {
        eventNewRegistrationReminder({
          eventId,
          jobType,
          studentProfileId,
          commsVariables: get(eventCommsRule, 'commsVariables', []),
          templateName: get(eventCommsRule, 'templateName'),
          isEmailRule: get(eventCommsRule, 'isEmailRule', false),
        }, () => callLocalGraphqlApi(deleteJob(jobId)));
      });
      break;
    }
    case 'eventSessionAttendance': {
      if (isUpdatingEventSession) {
        await getScheduleJobAndDelete(eventSessionId);
      }
      const res = await callLocalGraphqlApi(addScheduleJob({
        jobType, eventSessionId, scheduledDate,
      }));
      const jobId = get(res, 'data.addScheduleJob.id');
      schedule.scheduleJob(scheduledDate, () => {
        addStudentToEventSession({
          eventSessionId,
          jobId,
        }, () => callLocalGraphqlApi(deleteJob(jobId)));
      });
      break;
    }
    default:
      break;
  }
};

export default addToSchedule;

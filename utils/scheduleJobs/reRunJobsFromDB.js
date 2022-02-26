/* eslint-disable no-console */
import schedule from 'node-schedule';
import moment from 'moment';
import { get } from 'lodash';
import callLocalGraphqlApi from '../../src/api/callLocalGraphqlApi';
import sendB2B2CBookReminderNextDay from './jobs/sendB2B2CBookReminderNextDay';
import sendB2B2CBookingReminder from './jobs/sendB2B2CBookingReminder';
import extractBatchSessionAndPostCarnival from '../../src/autoGenerate/graphql/postHookFunctions/utils/extractBatchSessionAndSendPostCarnival';
import sendB2CBookReminderNextDay from './jobs/sendB2CBookReminderNextDay';
import sendB2CSessionReminder from './jobs/sendB2CSessionReminder';
import sendMentorSessionReminder from './jobs/sendMentorSessionReminder';
import sendMentorSessionReminderB2B2C from './jobs/sendMentorSessionReminderB2B2C';
import sendMentorVerifyBookingReminder from './jobs/sendMentorVerifyBookingReminder';
import scheduleB2BSessionReminder from './scheduleB2BSessionReminder';
import scheduleB2BSessionHomeworkRemainder from './scheduleB2BSessionHomeworkRemainder';
import eventNewRegistrationReminder from './jobs/eventNewRegistrationReminder';
import sendEventCommunication from './jobs/sendEventCommunication';
// import addStudentToEventSession from './jobs/addStudentsToEventSession';

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
    menteeSessionId
    mentorMenteeSessionId
    menteeId
    menteeSessionUpdatedAt
    courseName
    batchCode
    schoolName
    sessionDate
    sessionTime
    sessionLink
    mentorUserId
    mentorPhoneNumber
    taskId
    eventId
    commsVariables{
      dataField
      whatsappVariableName
      emailVariableName
    }
    studentProfileId
    templateName
    isEmailRule
    condition
    attendanceFilter
    unit
    value
  }
}`;

const deleteJobQuery = (id) => `
  mutation {
    deleteScheduleJob(id: "${id}") {
      id
    }
  }
`;

const reRunJobsFromDB = async () => {
  const res = await callLocalGraphqlApi(FETCH_JOBS);
  const scheduledJobs = get(res, 'data.scheduleJobs', []);
  console.log('jobs length', scheduledJobs.length);
  scheduledJobs.forEach(async (scheduledJob) => {
    const {
      jobType,
      scheduledDate,
      parent,
      id,
      code,
      batchSessionId,
      menteeSessionId,
      menteeSessionUpdatedAt,
      menteeId,
      mentorMenteeSessionId,
      courseName,
      batchCode,
      schoolName,
      sessionDate,
      sessionTime,
      sessionLink,
      mentorUserId,
      mentorPhoneNumber,
      taskId,
      eventId,
      commsVariables,
      studentProfileId,
      templateName,
      isEmailRule,
      condition,
      attendanceFilter,
      unit,
      value,
    } = scheduledJob;
    const deleteJob = () => callLocalGraphqlApi(deleteJobQuery(id));
    const isPast = moment().isAfter(scheduledDate);
    const userId = get(parent, 'id');
    if (jobType === 'eventCommsJob') {
      sendEventCommunication({
        eventId,
        jobType,
        commsVariables,
        templateName,
        isEmailRule,
        condition,
        attendanceFilter,
        value,
        unit,
        jobId: id,
        isPast,
      });
    }
    // switch (jobType) {
    //   case 'sendB2BReminder': {
    //     if (isPast) {
    //       scheduleB2BSessionReminder(batchSessionId, deleteJob);
    //     } else {
    //       schedule.scheduleJob(new Date(scheduledDate), () => {
    //         scheduleB2BSessionReminder(batchSessionId, deleteJob);
    //       });
    //     }
    //     break;
    //   }
    //   case 'sendB2BHomeworkReminder': {
    //     if (isPast) {
    //       scheduleB2BSessionHomeworkRemainder(batchSessionId, deleteJob);
    //     } else {
    //       schedule.scheduleJob(new Date(scheduledDate), () => {
    //         scheduleB2BSessionHomeworkRemainder(batchSessionId, deleteJob);
    //       });
    //     }
    //     break;
    //   }
    //   case 'sendNextDayBookReminder': {
    //     if (isPast) {
    //       sendB2B2CBookReminderNextDay({ userId: get(parent, 'id'), code }, deleteJob);
    //     } else {
    //       schedule.scheduleJob(new Date(scheduledDate), () => {
    //         sendB2B2CBookReminderNextDay({ userId: get(parent, 'id'), code }, deleteJob);
    //       });
    //     }
    //     break;
    //   }
    //   case 'sendB2CBookReminderNextDay': {
    //     if (isPast) {
    //       sendB2CBookReminderNextDay({ userId }, deleteJob);
    //     } else {
    //       schedule.scheduleJob(new Date(scheduledDate), () => {
    //         sendB2CBookReminderNextDay({ userId }, deleteJob);
    //       });
    //     }
    //     break;
    //   }
    //   case 'engagementMail': {
    //     schedule.scheduleJob(new Date(scheduledDate), () => {
    //       sendB2B2CBookingReminder({ userId, code, jobType }, deleteJob);
    //     });
    //     break;
    //   }
    //   case 'engagementMailWithMentor': {
    //     schedule.scheduleJob(new Date(scheduledDate), () => {
    //       sendB2B2CBookingReminder({ userId, code, jobType }, deleteJob);
    //     });
    //     break;
    //   }
    //   case 'bookingFinalReminder': {
    //     schedule.scheduleJob(new Date(scheduledDate), () => {
    //       sendB2B2CBookingReminder({ userId, code, jobType }, deleteJob);
    //     });
    //     break;
    //   }
    //   case 'bookingSameDayFinalReminder': {
    //     schedule.scheduleJob(new Date(scheduledDate), () => {
    //       sendB2B2CBookingReminder({ userId, code, jobType }, deleteJob);
    //     });
    //     break;
    //   }
    //   case 'sessionReminderWati': {
    //     schedule.scheduleJob(new Date(scheduledDate), () => {
    //       sendB2B2CBookingReminder({ userId, code, jobType }, deleteJob);
    //     });
    //     break;
    //   }
    //   case 'postCarnivalMail': {
    //     schedule.scheduleJob(new Date(scheduledDate), () => {
    //       extractBatchSessionAndPostCarnival({ batchSessionId }, deleteJob);
    //     });
    //     break;
    //   }
    //   case 'B2CEngagementMail': {
    //     schedule.scheduleJob(new Date(scheduledDate), () => {
    //       sendB2CSessionReminder({
    //         userId: menteeId, jobType, menteeSessionId, menteeSessionUpdatedAt,
    //       }, deleteJob);
    //     });
    //     break;
    //   }
    //   case 'B2CEngagementMailWithMentor': {
    //     schedule.scheduleJob(new Date(scheduledDate), () => {
    //       sendB2CSessionReminder({
    //         userId: menteeId, jobType, menteeSessionId, menteeSessionUpdatedAt,
    //       }, deleteJob);
    //     });
    //     break;
    //   }
    //   case 'B2CBookingFinalReminder': {
    //     schedule.scheduleJob(new Date(scheduledDate), () => {
    //       sendB2CSessionReminder({
    //         userId: menteeId, jobType, menteeSessionId, menteeSessionUpdatedAt,
    //       }, deleteJob);
    //     });
    //     break;
    //   }
    //   case 'B2CBookingSameDayFinalReminder': {
    //     schedule.scheduleJob(new Date(scheduledDate), () => {
    //       sendB2CSessionReminder({
    //         userId: menteeId, jobType, menteeSessionId, menteeSessionUpdatedAt,
    //       }, deleteJob);
    //     });
    //     break;
    //   }
    //   case 'B2CSessionReminderWati': {
    //     schedule.scheduleJob(new Date(scheduledDate), () => {
    //       sendB2CSessionReminder({
    //         userId: menteeId, jobType, menteeSessionId, menteeSessionUpdatedAt,
    //       }, deleteJob);
    //     });
    //     break;
    //   }
    //   case 'mentorSessionNotificationB2C': {
    //     schedule.scheduleJob(new Date(scheduledDate), () => {
    //       sendMentorSessionReminder({
    //         mentorMenteeSessionId, jobType,
    //       }, deleteJob);
    //     });
    //     break;
    //   }
    //   case 'mentorSessionNotificationB2B2C': {
    //     schedule.scheduleJob(new Date(scheduledDate), () => {
    //       sendMentorSessionReminderB2B2C({
    //         jobType,
    //         batchSessionId,
    //         courseName,
    //         batchCode,
    //         schoolName,
    //         sessionDate,
    //         sessionTime,
    //         sessionLink,
    //         mentorUserId,
    //         mentorPhoneNumber,
    //       }, deleteJob);
    //     });
    //     break;
    //   }
    //   case 'sendMentorVerifyBookingReminder': {
    //     schedule.scheduleJob(new Date(scheduledDate), () => {
    //       sendMentorVerifyBookingReminder({
    //         taskId, mentorUserId, jobType,
    //       }, deleteJob);
    //     });
    //     break;
    //   }
    //   case 'eventCommsJob': {
    //     // eslint-disable-next-line no-console
    //     console.log('scheduler', jobType);
    //     if (isPast) {
    //       sendEventCommunication({
    //         eventId,
    //         jobType,
    //         commsVariables,
    //         templateName,
    //         isEmailRule,
    //         condition,
    //         attendanceFilter,
    //         value,
    //         unit,
    //         jobId: id,
    //         isPast,
    //       }, deleteJob);
    //     } else {
    //       schedule.scheduleJob(new Date(scheduledDate), () => {
    //         sendEventCommunication({
    //           eventId,
    //           jobType,
    //           commsVariables,
    //           templateName,
    //           isEmailRule,
    //           condition,
    //           attendanceFilter,
    //           value,
    //           unit,
    //           jobId: id,
    //           isPast,
    //         }, deleteJob);
    //       });
    //     }
    //     break;
    //   }
    //   case 'eventNewRegistrationReminder': {
    //     // eslint-disable-next-line no-console
    //     console.log('scheduler regi', jobType, isPast);
    //     if (isPast) {
    //       eventNewRegistrationReminder({
    //         eventId,
    //         jobType,
    //         studentProfileId,
    //         commsVariables,
    //         templateName,
    //         isEmailRule,
    //       }, deleteJob);
    //     } else {
    //       schedule.scheduleJob(new Date(scheduledDate), () => {
    //         eventNewRegistrationReminder({
    //           eventId,
    //           jobType,
    //           studentProfileId,
    //           commsVariables,
    //           templateName,
    //           isEmailRule,
    //         }, deleteJob);
    //       });
    //     }
    //     break;
    //   }
    //   default:
    //     break;
    // }
  });
};

export default reRunJobsFromDB;

// import moment from 'moment';
import { get } from 'lodash';
import callLocalGraphqlApi from '../../../src/api/callLocalGraphqlApi';
// import getMentorCodingLanguages from '../../../src/autoGenerate/graphql/resolvers/utils/getMentorCodingLanguages';
// import sendTransactionalEmail from '../../../src/autoGenerate/graphql/resolvers/utils/sendTransactionalEmail';
// import getFullFilePath from '../../getFullFilePath';
// import getSlotLabel from '../../getSlotLabel';
// import sendWhatsAppTemplateMessage from '../../../src/autoGenerate/utils/sendWhatsAppTemplateMessage';

const TASK = (id) => `
{
  task(id: "${id}"){
    id
    hasMentorAttemptedContact
    mentorMenteeSession{
      mentorSession{
        user{
          id
        }
      }
    }
  }
}
`;

const sendB2B2CBookingReminder = async ({ mentorUserId, taskId }, deleteJob = () => { }) => {
  const res = await callLocalGraphqlApi(TASK(taskId));
  // check if mentor has Attempted to verify booking
  // also check if same mentor is still linked to the task
  // if not then send comms
  if (!res) return;
  const hasMentorAttemptedContact = get(res, 'data.task.hasMentorAttemptedContact');
  const mentorAssignedToTaskId = get(res, 'data.task.mentorMenteeSession.mentorSession.user.id', '');
  if (!hasMentorAttemptedContact && mentorAssignedToTaskId === mentorUserId) {
    // contact mentor to assign comms
  }
  // const parentName = get(res, 'data.user.name');
  // const phone = get(res, 'data.user.phone.countryCode', '').replace('+', '') + get(res, 'data.user.phone.number');
  // const studentName = get(res, 'data.user.parentProfile.children[0].user.name');
  // const timeTable = get(res, 'data.user.parentProfile.children[0].batch.b2b2ctimeTable', {});
  // const { bookingDate, ...slots } = timeTable;
  // const slotTime = Object.keys(slots).find((slot) => slots[slot]);
  // const date = moment(get(res, 'data.user.parentProfile.children[0].batch.b2b2ctimeTable')).format('dddd, MMM Do');
  // const startTime = getSlotLabel(slotTime.replace('slot', '')).startTime;
  // const endTime = getSlotLabel(slotTime.replace('slot', '')).endTime.replace('00', '30'); // change this so that it can handle ::30
  // const mentorInfo = get(res, 'data.user.parentProfile.children[0].batch.allottedMentor.mentorProfile');
  // const mentorName = get(res, 'data.user.parentProfile.children[0].batch.allottedMentor.name', '');
  // const experienceYear = get(mentorInfo, 'experienceYear') || 3;
  // const sessionLink = get(mentorInfo, 'googleMeetLink') ? get(mentorInfo, 'googleMeetLink') : get(mentorInfo, 'sessionLink');
  // const mentorProfilePic = getFullFilePath(get(res, 'data.user.parentProfile.children[0].batch.allottedMentor.profilePic.uri', ''));
  // const schoolName = getFullFilePath(get(res, 'data.user.parentProfile.children[0].batch.school.name', ''));
  // const codingLanguages = getMentorCodingLanguages(get(mentorInfo, 'codingLanguages'), []) || 'Python';
  // if (jobType === 'engagementMail') {
  //   sendTransactionalEmail({
  //     parentEmail,
  //     parentName,
  //     studentName,
  //   }, {
  //     emailTemplate: 'CarnivalEmailEngagement',
  //     subject: `${parentName}, Here are few Coding Terms you should know!`,
  //   });
  // } else if (jobType === 'engagementMailWithMentor') {
  //   sendTransactionalEmail({
  //     parentEmail,
  //     parentName,
  //     studentName,
  //     bookingDate: date,
  //     startTime,
  //     endTime,
  //     mentorProfilePic,
  //     mentorName,
  //     experienceYear,
  //     codingLanguages,
  //   }, {
  //     emailTemplate: 'CarnivalEmailReminderMentorDetails',
  //     subject: 'Meet your mentor for the Code Jam Session!',
  //   });
  // } else if (jobType === 'bookingFinalReminder') {
  //   sendTransactionalEmail({
  //     sessionLink,
  //     parentEmail,
  //     bookingDate: date,
  //     startTime,
  //     endTime,
  //   }, {
  //     emailTemplate: 'CarnivalEmailReminderSessionLink',
  //     subject: `${studentName}, Your link to join Tekie Code Jam, which starts soon!`,
  //   });
  //   sendWhatsAppTemplateMessage(phone, 'code_jam_reminder_1', parentName, [
  //     { name: 'parent_name', value: parentName },
  //     { name: 'student_name', value: studentName },
  //     { name: 'w_date', value: date },
  //     { name: 'w_time', value: startTime },
  //     { name: 'school_name', value: schoolName },
  //     { name: 'session_link', value: sessionLink },
  //   ]);
  // } else if (jobType === 'sessionReminderWati') {
  //   sendWhatsAppTemplateMessage(phone, 'code_jam_reminder_2', parentName, [
  //     { name: 'parent_name', value: parentName },
  //     { name: 'student_name', value: studentName },
  //     { name: 'session_link', value: sessionLink },
  //   ]);
  // } else {
  //   sendTransactionalEmail({
  //     parentEmail,
  //     parentName,
  //     studentName,
  //     bookingDate: date,
  //     startTime,
  //     endTime,
  //     mentorProfilePic,
  //     mentorName,
  //     experienceYear,
  //     codingLanguages,
  //     sessionLink,
  //   }, {
  //     emailTemplate: 'CarnivalEmailReminderSameDay',
  //     subject: 'Your Code Jam starts in 3 hours! Here\'s your link for the session.',
  //   });
  // }
  deleteJob();
};

export default sendB2B2CBookingReminder;

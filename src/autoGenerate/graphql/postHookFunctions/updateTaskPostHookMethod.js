/* eslint-disable no-console */
import { get } from 'lodash';
import moment from 'moment';
// import extractSlotsFromInput from '../../../../utils/extractSlotsFromInput';
// import getSelectedDays from './utils/getSelectedDays';
// import getPossibleDates from '../../../../utils/getPossibleDates';
// import {
//   getTopics, getBatchSessions, createBatchSession, updateBatchSession,
// } from './utils/updateBatchPostHookQueries';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import getSelectedSlotsTime from '../preHookFunctions/validation/utils/getSelectedSlotsTime';
import getSlotTimesInString from '../../../../utils/getSlotTimesInString';
import sendWhatsappMessageForBookingConfirmedByLeadPartner
from './utils/sendWhatsappMessageForBookingConfirmedByLeadPartner';
import getMenteeInfo from './utils/getMenteeInfo';
import addToSchedule from '../../../../utils/scheduleJobs/addToSchedule';

// const updateTask = async (id, input) => {
//   const query = `
// mutation($input: TaskUpdate!){
//   updateTask(
//   input:$input
//   id: "${id}"
//   ){
//     id
//   }
// }
// `;
//   const variables = {
//     input,
//   };
//   const res = await callLocalGraphqlApi(query, '', variables);
//   return get(res, 'data.updateTask.id');
// };

const updateUser = async (id, input) => {
  const query = `
mutation($input: UserUpdate!){
  updateUser(
  input:$input
  id: "${id}"
  ){
    id
  }
}
`;
  const variables = {
    input,
  };
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.updateUser.id');
};

const menteeSessionQuery = (menteeSessionId) => `{
  menteeSession(id: "${menteeSessionId}") {
    id
    bookingDate
    ${getSlotTimesInString()}
    bookedBy
    user {
      id
      name
      country
      studentProfile {
        parents {
          user {
            id
            name
            email
            phone {
              number
              countryCode
            }
          }
        }
      }
    }
  }
}`;

const mmsQuery = (mmsId) => `{
  mentorMenteeSession(id: "${mmsId}") {
    id
    mentorSession{
      user{
        id
      }
    }
  }
}`;

/*
  Post hook of update batch
*/
/* eslint-disable no-unused-vars */
const updateTaskPostHookMethod = async (input, params, mutationName, context) => {
  const { id: taskId } = params;
  console.log('taskId', taskId);
  const {
    leadStatus,
    bookingStatus,
  } = input;
  console.log('leadStatus', leadStatus);
  console.log('bookingStatus', bookingStatus);
  const menteeSession = await callLocalGraphqlApi(menteeSessionQuery(get(input, 'menteeSession.typeId')));
  console.log('menteeSession', menteeSession);
  const mentorMenteeSession = await callLocalGraphqlApi(mmsQuery(get(input, 'mentorMenteeSession.typeId')));
  console.log('mentorMenteeSession', mentorMenteeSession);
  const mentorUserId = get(mentorMenteeSession, 'data.mentorMenteeSession.mentorSession.user.id', '');
  console.log('mentorUserId', mentorUserId);
  const userId = get(menteeSession, 'data.menteeSession.user.id');
  const userInfo = await getMenteeInfo(userId);
  // const topicInfo = await getTopicInfo(get(params, 'topicConnectId'));
  // const courseInfo = await getCourseInfo(get(params, 'courseConnectId'));
  const slotTimeStringArray = getSelectedSlotsTime(get(menteeSession, 'data.menteeSession', []));
  console.log('slotTimeStringArray', slotTimeStringArray);
  const bookingDate = get(menteeSession, 'data.menteeSession.bookingDate', '');
  console.log('bookingDate', bookingDate);
  /*
    a. If marked interested
  */
  // const updateTaskInput = {};
  const updateMenteeInput = {};
  if (leadStatus === 'leadInterested'
    || leadStatus === 'leadInterestedFollowUp') {
    updateMenteeInput.verificationStatus = 'verified';
  }
  /*
    b. If marked not interested, task should be marked cancelled from frontend
  */
  /*
    c. If marked not connected
  */
  if (leadStatus === 'leadNotConnected') {
    // send message to lead to confirm booking
    sendWhatsappMessageForBookingConfirmedByLeadPartner(userInfo, slotTimeStringArray, bookingDate);
    // schedule comms message to mentor to contact parent
    const mentorContactParentReminder = moment(new Date()).add(1, 'hours').toDate();
    addToSchedule('sendMentorVerifyBookingReminder', mentorContactParentReminder, {
      mentorUserId,
      taskId,
    });
  }
  // console.log('updateTaskInput', updateTaskInput);
  console.log('updateMenteeInput', updateMenteeInput);
  // await updateTask(taskId, updateTaskInput);
  await updateUser(userId, updateMenteeInput);
};

export default updateTaskPostHookMethod;

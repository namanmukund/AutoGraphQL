import { get } from 'lodash';
import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
// import increaseParticularAvailableSlotOfADate from './utils/increaseParticularAvailableSlotOfADate';
import isTrialSession from '../resolvers/utils/isTrialSession';
import deleteMenteeBookingLeadSquared from './leadsquared/deleteMenteeBookingLeadSquared';
import getMenteeInfo from './utils/getMenteeInfo';
import getTopicInfo from './utils/getTopicInfo';
import { byPassMenteeValidationApps } from '../../../../constants';
import addSessionLog from './utils/addSessionLog';
import sendSessionCancellationMessage from './utils/sendSessionCancellationMessage';
import deleteMentorMenteeSessionQuery from './utils/deleteMentorMenteeSessionQuery';
import isMentorChild from './utils/isMentorChild';

const deleteMenteeSessionPostHookMethod = async (input, mutationName, context) => {
  /*
  Since doc is deleted increase corresponding availability slots
   */
  const { previousDocument, currentUser } = context;
  const { bookingDate, ...slots } = previousDocument;
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);
  const isTrial = await isTrialSession(input.topic.typeId);
  const userInfo = await getMenteeInfo(get(input, 'user.typeId'));
  const topicInfo = await getTopicInfo(get(input, 'topic.typeId'));
  const clientId = get(userInfo, 'data.user.id', '');
  const isItMentorChild = await isMentorChild(clientId);

  const studentName = get(userInfo, 'data.user.name', '');
  const parentName = get(userInfo, 'data.user.studentProfile.parents[0].user.name', '');
  const { appName } = context;

  // if call is from backend we will not update the availability slots, same for paid sessions
  if (typeof isTrial === 'boolean' && isTrial && !byPassMenteeValidationApps.includes(appName) && !isItMentorChild) {
    // await increaseParticularAvailableSlotOfADate(slotTimeStringArray, bookingDate, context);
    if (context.mentorSessionId) {
      const parentNumber = `${get(
        userInfo,
        'data.user.studentProfile.parents[0].user.phone.countryCode',
        '',
      )}-${get(
        userInfo,
        'data.user.studentProfile.parents[0].user.phone.number',
        '',
      )}`;
      sendSessionCancellationMessage(context.mentorSessionId, bookingDate, slotTimeStringArray, studentName, parentName, parentNumber);
    }
  }

  if (context.mmsId) {
    await deleteMentorMenteeSessionQuery(context.mmsId, context);
  }
  // await extractMenteeSessionInfoAndSendEmail('delete', input, bookingDate, slotTimeStringArray, '', [], userInfo, topicInfo);

  // update session log entry
  const courseId = get(input, 'course.typeId', '');
  const topicId = get(topicInfo, 'data.topic.id', '');
  const batchCode = get(userInfo, 'data.user.studentProfile.batch.code', '');
  addSessionLog(bookingDate, slotTimeStringArray, clientId, topicId, currentUser, courseId, 'deleteMenteeSession', batchCode, '', '');

  if (!isItMentorChild) {
    deleteMenteeBookingLeadSquared(userInfo, topicInfo, context.userIdFromContext === clientId);
  }
};

export default deleteMenteeSessionPostHookMethod;

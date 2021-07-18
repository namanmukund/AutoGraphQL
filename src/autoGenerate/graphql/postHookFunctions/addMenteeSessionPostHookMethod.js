import { get } from 'lodash';
import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
import reduceParticularAvailableSlotOfADate from './utils/reduceParticularAvailableSlotOfADate';
import extractMenteeSessionInfoAndSendEmail from './utils/extractMenteeSessionInfoAndSendEmail';
import { addMenteeBookingLeadsquared } from './leadsquared';
import getMenteeInfo from './utils/getMenteeInfo';
import getTopicInfo from './utils/getTopicInfo';
import { byPassMenteeValidationApps } from '../../../../constants';
import addSessionLog from './utils/addSessionLog';

const addMenteeSessionPostHookMethod = async (input, mutationName, context, params) => {
  // don't decrease the availability slot if it is done through backend
  const { appName, isBookedByMentee, currentUser } = context;
  if (!byPassMenteeValidationApps.includes(appName)) {
    /*
    Since addition of session by mentee will consume a slot
     */
    const { id: menteeSessionId, bookingDate, ...slots } = input;
    const slotTimeStringArray = getSelectedSlotsStringArray(slots);
    const { availableSlots } = context;
    const userInfo = await getMenteeInfo(get(input, 'user.typeId'));
    const topicInfo = await getTopicInfo(get(input, 'topic.typeId'));
    await reduceParticularAvailableSlotOfADate(slotTimeStringArray, bookingDate, context, availableSlots);
    // send email to mentor admin regarding the session
    await extractMenteeSessionInfoAndSendEmail('add', input, bookingDate, slotTimeStringArray, '', [], userInfo, topicInfo);
    // update user booking on leadsquared
    addMenteeBookingLeadsquared(input, params, slotTimeStringArray, userInfo, topicInfo, isBookedByMentee);
    // update session log entry
    const courseId = get(input, 'course.typeId', '');
    const clientId = get(userInfo, 'data.user.id', '');
    const topicId = get(topicInfo, 'data.topic.id', '');
    const batchCode = get(userInfo, 'data.user.studentProfile.batch.code', '');
    addSessionLog(bookingDate, slotTimeStringArray, clientId, topicId, currentUser, courseId, 'addMenteeSession', batchCode, '', '');
  }
};

export default addMenteeSessionPostHookMethod;

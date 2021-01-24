import { get } from 'lodash';
import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
import reduceParticularAvailableSlotOfADate from './utils/reduceParticularAvailableSlotOfADate';
import extractMenteeSessionInfoAndSendEmail from './utils/extractMenteeSessionInfoAndSendEmail';
import { addMenteeBookingLeadsquared } from './leadsquared';
import getMenteeInfo from './utils/getMenteeInfo';
import getTopicInfo from './utils/getTopicInfo';
import { byPassMenteeValidationApps } from '../../../../constants';

const addMenteeSessionPostHookMethod = async (input, mutationName, context, params) => {
  // don't decrease the availability slot if it is done through backend
  const { appName } = context;
  if (!byPassMenteeValidationApps.includes(appName)) {
    /*
    Since addition of session by mentee will consume a slot
     */
    const {
      id: menteeSessionId, bookingDate, country, ...slots
    } = input;
    const slotTimeStringArray = getSelectedSlotsStringArray(slots);
    const { availableSlots } = context;
    const userInfo = await getMenteeInfo(get(input, 'user.typeId'));
    const topicInfo = await getTopicInfo(get(input, 'topic.typeId'));
    await reduceParticularAvailableSlotOfADate(
      slotTimeStringArray,
      bookingDate,
      context,
      availableSlots,
      country,
    );
    // send email to mentor admin regarding the session
    await extractMenteeSessionInfoAndSendEmail('add', input, bookingDate, slotTimeStringArray, '', [], userInfo, topicInfo);
    // update user booking on leadsquared
    addMenteeBookingLeadsquared(input, params, slotTimeStringArray, userInfo, topicInfo);
  }
};

export default addMenteeSessionPostHookMethod;

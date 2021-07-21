import { get } from 'lodash';
import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
import reduceParticularAvailableSlotOfADate from './utils/reduceParticularAvailableSlotOfADate';
import increaseParticularAvailableSlotOfADate from './utils/increaseParticularAvailableSlotOfADate';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import availableSlotsQuery from '../graphqlQueries/availableSlotsQuery';
import updateAvailableSlotQuery from '../graphqlQueries/updateAvailableSlotQuery';
import extractMenteeSessionInfoAndSendEmail from './utils/extractMenteeSessionInfoAndSendEmail';
import isTrialSession from '../resolvers/utils/isTrialSession';
import updateScheduleStatusOfMenteeSession from '../../../../utils/scheduleJobs/updateScheduleStatusOfMenteeSession';
import getMenteeInfo from './utils/getMenteeInfo';
import deleteMentorMenteeSessionQuery from './utils/deleteMentorMenteeSessionQuery';
import getTopicInfo from './utils/getTopicInfo';
import rescheduleMenteeBookingLeadsquared from './leadsquared/rescheduleMenteeBookingLeadsquared';
import { byPassMenteeValidationApps } from '../../../../constants';
import addSessionLog from './utils/addSessionLog';
import updateUserBookingAgent from './utils/updateUserBookingAgent';
import sendSessionCancellationMessage from './utils/sendSessionCancellationMessage';

const updateMenteeSessionPostHookMethod = async (input, mutationName, context) => {
  const { previousDocument, currentUser } = context;
  const { id: menteeSessionId, bookingDate: prevBookingDate, ...prevSlots } = previousDocument;
  const prevSlotTimeStringArray = getSelectedSlotsStringArray(prevSlots);

  const { bookingDate, ...slots } = input;
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);

  // Only for trial session and only for india
  /* if a mentee has changed the date to future
  --increase the availability slot from the prevBookingDate
  -- decrease the availability slot of current availabilityDate
  if a mentee has changed the slots of the current date
  ---decrease for new slots and increase for old slots
 */

  const isTrial = await isTrialSession(input.topic.typeId);
  const { appName } = context;
  const userInfo = await getMenteeInfo(get(input, 'user.typeId'));
  const isBookedByMentee = get(context, 'userIdFromContext') === get(input, 'user.typeId');
  const topicInfo = await getTopicInfo(get(input, 'topic.typeId'));
  // if call is from backend we will not update the availability slots, same for paid sessions
  if (typeof isTrial === 'boolean' && isTrial && !byPassMenteeValidationApps.includes(appName)) {
    if (bookingDate && bookingDate.getTime() !== prevBookingDate.getTime()) {
      // -- decrease the availability slot of current availabilityDate
      await reduceParticularAvailableSlotOfADate(slotTimeStringArray, bookingDate, context);
      // --increase the availability slot from the prevBookingDate
      await increaseParticularAvailableSlotOfADate(prevSlotTimeStringArray, prevBookingDate, context);
    } else {
      // ---decrease for new slots and increase for old slots
      const availableSlotsRes = await callLocalGraphqlApi(availableSlotsQuery(bookingDate));
      const availableSlots = get(availableSlotsRes, 'data.availableSlots');
      // update if doc exist else leave
      if (availableSlots && availableSlots.length) {
        const docToBeUpdated = {};

        // increase for old slots
        prevSlotTimeStringArray.forEach((slot) => {
          docToBeUpdated[slot] = (availableSlots[0][slot] >= 0 ? availableSlots[0][slot] : 0) + 1;
        });

        // ---decrease for new slots
        slotTimeStringArray.forEach((slot) => {
          if (availableSlots[0][slot] > 0) {
            docToBeUpdated[slot] = availableSlots[0][slot] - 1;
          }
        });

        const { id: availableSlotId } = availableSlots[0];
        const variables = {
          input: docToBeUpdated,
        };
        await callLocalGraphqlApi(updateAvailableSlotQuery(availableSlotId), context, variables);
      }
    }
    await updateScheduleStatusOfMenteeSession(menteeSessionId, 'todo');

    const studentName = get(userInfo, 'data.user.name', '');
    const parentName = get(userInfo, 'data.user.studentProfile.parents[0].user.name', '');

    if (
      (prevBookingDate.getTime() !== bookingDate.getTime())
    || (get(prevSlotTimeStringArray, '0') !== get(slotTimeStringArray, '0'))
    ) {
      if (context.mentorSessionId) {
        sendSessionCancellationMessage(context.mentorSessionId, prevBookingDate, prevSlotTimeStringArray, studentName, parentName);
      }
    }
  }

  // send email to mentor admin regarding the session
  await extractMenteeSessionInfoAndSendEmail(
    'update',
    input,
    bookingDate,
    slotTimeStringArray,
    prevBookingDate,
    prevSlotTimeStringArray,
    userInfo,
    topicInfo,
  );
  if (!byPassMenteeValidationApps.includes(appName)) {
    if (get(context, 'userIdFromContext')) {
      updateUserBookingAgent(menteeSessionId, get(context, 'userIdFromContext'), bookingDate, get(slotTimeStringArray, '0'));
    }
    // update booking time on leadsquared
    rescheduleMenteeBookingLeadsquared(input, slotTimeStringArray, userInfo, topicInfo, isBookedByMentee, get(context, 'userIdFromContext'));
    // update session log entry
    const courseId = get(input, 'course.typeId', '');
    const clientId = get(userInfo, 'data.user.id', '');
    const topicId = get(topicInfo, 'data.topic.id', '');
    const batchCode = get(userInfo, 'data.user.studentProfile.batch.code', '');
    addSessionLog(bookingDate, slotTimeStringArray, clientId, topicId, currentUser, courseId, 'updateMenteeSession', batchCode, '', '');
  }

  if (context.mmsId) {
    deleteMentorMenteeSessionQuery();
  }
};

export default updateMenteeSessionPostHookMethod;

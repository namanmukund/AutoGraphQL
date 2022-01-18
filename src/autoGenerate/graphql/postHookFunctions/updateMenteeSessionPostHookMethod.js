/* eslint-disable no-console */
import { difference, get } from 'lodash';
import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
// import reduceParticularAvailableSlotOfADate from './utils/reduceParticularAvailableSlotOfADate';
// import increaseParticularAvailableSlotOfADate from './utils/increaseParticularAvailableSlotOfADate';
// import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
// import availableSlotsQuery from '../graphqlQueries/availableSlotsQuery';
// import updateAvailableSlotQuery from '../graphqlQueries/updateAvailableSlotQuery';
import extractMenteeSessionInfoAndSendEmail from './utils/extractMenteeSessionInfoAndSendEmail';
import isTrialSession from '../resolvers/utils/isTrialSession';
import updateScheduleStatusOfMenteeSession from '../../../../utils/scheduleJobs/updateScheduleStatusOfMenteeSession';
import getMenteeInfo from './utils/getMenteeInfo';
import deleteMentorMenteeSessionQuery from './utils/deleteMentorMenteeSessionQuery';
import getTopicInfo from './utils/getTopicInfo';
import rescheduleMenteeBookingLeadsquared from './leadsquared/rescheduleMenteeBookingLeadsquared';
import { byPassMenteeValidationApps, sessionType, userSourceOrigin } from '../../../../constants';
import addSessionLog from './utils/addSessionLog';
import updateUserBookingAgent from './utils/updateUserBookingAgent';
import sendSessionCancellationMessage from './utils/sendSessionCancellationMessage';
import mentorAvailabilitySlotOperation from './utils/mentorAvailabilitySlotOperation';
import sendMailAndWhatsappMessageForSupplyRequest from '../../utils/sendMailAndWhatsappMessageForSupplyRequest';
import getCourseInfo from './utils/getCourseInfo';
import getSlotLabel from '../../../../utils/getSlotLabel';
import { log } from '../../../../utils';

const updateMenteeSessionPostHookMethod = async (input, mutationName, context) => {
  const {
    previousDocument, currentUser, mentorMenteeSessionDoc,
  } = context;
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

  // console.log('bookingDate', bookingDate);
  // console.log('prevBookingDate', prevBookingDate);
  // console.log('previousDocument', previousDocument);
  const isTrial = await isTrialSession(input.topic.typeId);
  const { appName } = context;
  const userInfo = await getMenteeInfo(get(input, 'user.typeId'));
  const isBookedByMentee = get(context, 'userIdFromContext') === get(input, 'user.typeId');
  const topicInfo = await getTopicInfo(get(input, 'topic.typeId'));
  // if call is from backend we will not update the availability slots, same for paid sessions
  if (typeof isTrial === 'boolean' && isTrial && !byPassMenteeValidationApps.includes(appName)) {
    const courseInfo = await getCourseInfo(get(input, 'course.typeId'));
    const prevBroadCastedMentors = get(previousDocument, 'broadCastedMentors', []).map((mentor) => get(mentor, 'id'));
    const newBroadcastedmentors = get(input, 'broadCastedMentors', []);
    // eslint-disable-next-line no-restricted-syntax
    for (const mentorProfile of newBroadcastedmentors) {
      if (!prevBroadCastedMentors.includes(get(mentorProfile, 'typeId'))) {
        const time = get(slotTimeStringArray, '0').split('slot')[1];
        const startTime = getSlotLabel(time).startTime;
        sendMailAndWhatsappMessageForSupplyRequest(get(mentorProfile, 'typeId'),
          {
            date: bookingDate,
            slotId: get(input, 'id'),
            course: get(courseInfo, 'data.course.title'),
            studentName: get(userInfo, 'data.user.name'),
            slotsTime: startTime,
          }, true);
      }
    }
    if (bookingDate && bookingDate.getTime() !== prevBookingDate.getTime()) {
      // ---------------------commenting out the previous availableSlots flow--------------
      // -- decrease the availability slot of current availabilityDate
      // await reduceParticularAvailableSlotOfADate(slotTimeStringArray, bookingDate, context);
      // --increase the availability slot from the prevBookingDate
      // await increaseParticularAvailableSlotOfADate(prevSlotTimeStringArray, prevBookingDate, context);
    } else {
      // ---decrease for new slots and increase for old slots
      // const availableSlotsRes = await callLocalGraphqlApi(availableSlotsQuery(bookingDate));
      // const availableSlots = get(availableSlotsRes, 'data.availableSlots');
      // update if doc exist else leave
      // if (availableSlots && availableSlots.length) {
      //   const docToBeUpdated = {};

      //   // increase for old slots
      //   prevSlotTimeStringArray.forEach((slot) => {
      //     docToBeUpdated[slot] = (availableSlots[0][slot] >= 0 ? availableSlots[0][slot] : 0) + 1;
      //   });

      //   // ---decrease for new slots
      //   slotTimeStringArray.forEach((slot) => {
      //     if (availableSlots[0][slot] > 0) {
      //       docToBeUpdated[slot] = availableSlots[0][slot] - 1;
      //     }
      //   });

      // const { id: availableSlotId } = availableSlots[0];
      // const variables = {
      //   input: docToBeUpdated,
      // };
      // await callLocalGraphqlApi(updateAvailableSlotQuery(availableSlotId), context, variables);
      // }
    }
    await updateScheduleStatusOfMenteeSession(menteeSessionId, 'todo');

    const studentName = get(userInfo, 'data.user.name', '');
    const parentName = get(userInfo, 'data.user.studentProfile.parents[0].user.name', '');

    if (
      (prevBookingDate.getTime() !== bookingDate.getTime())
      || (get(prevSlotTimeStringArray, '0') !== get(slotTimeStringArray, '0'))
    ) {
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
        sendSessionCancellationMessage(context.mentorSessionId, prevBookingDate, prevSlotTimeStringArray, studentName, parentName, parentNumber);
      }

      // send email to mentor admin regarding the session
      extractMenteeSessionInfoAndSendEmail(
        'update',
        input,
        bookingDate,
        slotTimeStringArray,
        prevBookingDate,
        prevSlotTimeStringArray,
        userInfo,
        topicInfo,
      );
    }
    const slotsToBeIncreasedInUpdate = difference(slotTimeStringArray, prevSlotTimeStringArray);
    const prevMentorAvailabilitySlot = get(input, 'mentorAvailabilitySlot.typeId');
    const isNotSourceSchool = get(userInfo, 'data.user.source') !== userSourceOrigin.school;
    const isBatchExist = get(userInfo, 'data.user.studentProfile.batch', false);
    if (isNotSourceSchool && !isBatchExist && slotsToBeIncreasedInUpdate.length > 0) {
      await mentorAvailabilitySlotOperation({
        slotTimeStringArray,
        date: bookingDate,
        mutationName,
        sessionType: sessionType.trial,
        sessionId: menteeSessionId,
        prevMentorAvailabilitySlot,
      });
    }
  }

  const updateMentorMenteeSessionInput = {};
  if (context.mmsId && (
    (prevBookingDate.getTime() !== bookingDate.getTime())
    || (get(prevSlotTimeStringArray, '0') !== get(slotTimeStringArray, '0'))
  )) {
    updateMentorMenteeSessionInput.hasRescheduled = get(mentorMenteeSessionDoc, 'hasRescheduled', false);
    updateMentorMenteeSessionInput.rescheduledDate = get(mentorMenteeSessionDoc, 'rescheduledDate', false);
    updateMentorMenteeSessionInput.rescheduledDateProvided = get(mentorMenteeSessionDoc, 'rescheduledDateProvided', null);
    log(`-----------Deleting MentorMenteeSession (updateMenteeSessionPostHook) -> ${context.mmsId}`);
    await deleteMentorMenteeSessionQuery(context.mmsId, context);
  }

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
    addSessionLog(bookingDate, slotTimeStringArray, clientId, topicId, currentUser, courseId, 'updateMenteeSession', batchCode, '', '', updateMentorMenteeSessionInput, get(context, 'isManualSession', false));
  }
};

export default updateMenteeSessionPostHookMethod;

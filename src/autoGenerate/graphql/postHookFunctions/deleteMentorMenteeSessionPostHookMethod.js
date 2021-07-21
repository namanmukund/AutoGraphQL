import { get } from 'lodash';
import getMenteeInfo from './utils/getMenteeInfo';
import addSessionLog from './utils/addSessionLog';
import sendSessionCancellationMessage from './utils/sendSessionCancellationMessage';
import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
import { TBA } from '../../../../constants';
/*
  - check if the user if from referral
  - check if the session is the first session
  - check if the referrer has not reached its limit
  - check if the session status is completed for the first time
 */

const deleteMentorMenteeSessionPostHookMethod = async (input, mutationName, context) => {
  const {
    currentUser,
  } = context;
  const menteeSession = context.menteeSession;
  const userId = get(menteeSession, 'data.menteeSession.user.id');
  const userInfo = await getMenteeInfo(userId);
  const topicId = get(input, 'topic.typeId', '');
  const mentorSessionId = get(input, 'mentorSession.typeId', '');
  if (currentUser && currentUser.id) {
    // update session log entry
    const courseId = get(input, 'course.typeId', '');
    const clientId = get(userInfo, 'data.user.id', '');
    const sessionStatus = get(input, 'sessionStatus');
    const menteeSessionDoc = get(menteeSession, 'data.menteeSession', {});
    const { bookingDate, ...slots } = menteeSessionDoc;
    const slotTimeStringArray = getSelectedSlotsStringArray(slots);
    const batchCode = get(userInfo, 'data.user.studentProfile.batch.code', '');
    addSessionLog(bookingDate, slotTimeStringArray, clientId, topicId, currentUser, courseId, 'deleteMentorMenteeSession', batchCode, mentorSessionId, sessionStatus);

    const studentName = get(menteeSession, 'data.menteeSession.user.name');
    const parentName = get(menteeSession, 'data.menteeSession.user.studentProfile.parents[0].user.name');
    if (get(menteeSession, 'data.menteeSession.topic.order') === 1) {
      if (context.currentApp !== TBA) {
        sendSessionCancellationMessage(mentorSessionId, bookingDate, slotTimeStringArray, studentName, parentName);
      }
    }
  }
};
export default deleteMentorMenteeSessionPostHookMethod;

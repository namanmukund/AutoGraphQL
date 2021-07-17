import { get } from 'lodash';
import getMenteeInfo from './utils/getMenteeInfo';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import getSlotTimesInString from '../../../../utils/getSlotTimesInString';
import addSessionLog from './utils/addSessionLog';
import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
/*
  - check if the user if from referral
  - check if the session is the first session
  - check if the referrer has not reached its limit
  - check if the session status is completed for the first time
 */

const userIdQuery = (menteeSessionId) => `{
  menteeSession(id: "${menteeSessionId}") {
    id
    bookingDate
    ${getSlotTimesInString()}
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

const deleteMentorMenteeSessionPostHookMethod = async (input, mutationName, context) => {
  const {
    currentUser, mentorSessionConnectId, previousDocument: { topic },
  } = context;
  const menteeSession = await callLocalGraphqlApi(userIdQuery(get(input, 'menteeSession.typeId')));
  const userId = get(menteeSession, 'data.menteeSession.user.id');
  const userInfo = await getMenteeInfo(userId);

  if (currentUser && currentUser.id) {
    // update session log entry
    const courseId = get(input, 'course.typeId', '');
    const clientId = get(userInfo, 'data.user.id', '');
    const topicId = topic && topic.id;
    const sessionStatus = get(input, 'sessionStatus');
    const menteeSessionDoc = get(menteeSession, 'data.menteeSession', {});
    const { bookingDate, ...slots } = menteeSessionDoc;
    const slotTimeStringArray = getSelectedSlotsStringArray(slots);
    console.log('----------------------------courseId', courseId);
    const batchCode = get(userInfo, 'data.user.studentProfile.batch.code', '');
    addSessionLog(bookingDate, slotTimeStringArray, clientId, topicId, currentUser, courseId, 'deleteMentorMenteeSession', batchCode, mentorSessionConnectId, sessionStatus);
  }
};
export default deleteMentorMenteeSessionPostHookMethod;

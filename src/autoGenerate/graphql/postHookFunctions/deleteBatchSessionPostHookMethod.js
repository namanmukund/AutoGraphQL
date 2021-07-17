import { get } from 'lodash';
import addSessionLog from './utils/addSessionLog';

const deleteBatchSessionPostHookMethod = async (input, params, mutationName, context) => {
  const {
    batchCode,
    topicId,
    bookingDate,
    mentorSessionConnectId,
    currentUser,
    sessionStatus,
    slotTimeStringArray,
  } = context;
  const courseId = get(context, 'courseId');

  console.log('----------------------------courseId', courseId);
  if (topicId) {
    addSessionLog(bookingDate, slotTimeStringArray, '', topicId, currentUser, courseId, 'deleteBatchSession', batchCode, mentorSessionConnectId, sessionStatus);
  }
};
export default deleteBatchSessionPostHookMethod;

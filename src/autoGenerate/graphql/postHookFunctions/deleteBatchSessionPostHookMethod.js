import { get } from 'lodash';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import addSessionLog from './utils/addSessionLog';

const deleteSchoolSessionOtp = async (schoolSessionOtpIn) => {
  const deleteQuery = `mutation {
    deleteSchoolSessionOtp(id: "${schoolSessionOtpIn}") {
        id
    }
    }
    `;
  const result = await callLocalGraphqlApi(deleteQuery);
  return get(result, 'data.deleteSchoolSessionOtp');
};

const deleteBatchSessionPostHookMethod = async (input, params, mutationName, context) => {
  const {
    batchCode,
    topicId,
    bookingDate,
    mentorSessionConnectId,
    currentUser,
    sessionStatus,
    slotTimeStringArray,
    schoolSessionOtpArray = [],
  } = context;
  const courseId = get(context, 'courseId');
  schoolSessionOtpArray.forEach((sessionOtp) => {
    deleteSchoolSessionOtp(get(sessionOtp, 'id'));
  });
  if (topicId) {
    addSessionLog(bookingDate, slotTimeStringArray, '', topicId, currentUser, courseId, 'deleteBatchSession', batchCode, mentorSessionConnectId, sessionStatus);
  }
};
export default deleteBatchSessionPostHookMethod;

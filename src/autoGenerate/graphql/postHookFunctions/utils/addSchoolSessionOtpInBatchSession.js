/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import moment from 'moment';
import { log } from '../../../../../utils';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const getBatchSessions = async (batchId) => {
  const query = `{
    batchSessions(
      filter: {
        and: [
          { batch_some: { id: "${batchId}" } }
          { bookingDate_gt: "${moment().startOf('day').toISOString()}" }
        ]
      }
    ) {
      id
    }
  }`;
  const batchSessions = await callLocalGraphqlApi(query);
  return get(batchSessions, 'data.batchSessions', []);
};

const updateBatchSession = async (batchSessionId, attendanceInput, schoolSessionInput) => {
  const updateQuery = `mutation {
  updateBatchSession(
    id: "${batchSessionId}"
    input: {
      ${attendanceInput}
      ${schoolSessionInput}
    }
  ) {
    id
  }
}
`;
  const result = await callLocalGraphqlApi(updateQuery);
  return get(result, 'data.updateBatchSession');
};

const addSchoolSessionOtpInBatchSession = async (batchId, studentProfileId, grade, section) => {
  const batchSessions = getBatchSessions(batchId, grade, section);
  for (const batchSession of batchSessions) {
    const attendanceInput = `attendance: { push: { isPresent: false, studentConnectId: "${studentProfileId}" } }`;
    const schoolSessionInput = `schoolSessionsOtp: {
        push: { studentConnectId: "${studentProfileId}", otp: 23, section: ${section}, grade: ${grade} }
      }`;
    await updateBatchSession(get(batchSession, 'id'), attendanceInput, schoolSessionInput);
    log(`updated batchSessionId ${get(batchSession, 'id')}`);
  }
};

export default addSchoolSessionOtpInBatchSession;

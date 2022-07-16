/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import moment from 'moment';
import { log } from '../../../../../utils';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import arrayCombinations from './generateOtpMap';

const getBatchSessions = async (batchId) => {
  const query = `{
    batchSessions(
      filter: {
        and: [
          { batch_some: { id: "${batchId}" } }
          { bookingDate: "${moment().startOf('day').toISOString()}" }
        ]
      }
    ) {
      id
      batch{
        type
      }
      schoolSessionsOtp {
        id
        section
        grade
      }
    }
  }`;
  const batchSessions = await callLocalGraphqlApi(query);
  return get(batchSessions, 'data.batchSessions', []);
};

const addSchoolSessionOtp = async ({
  otp, batchSessionId,
}) => {
  const addQuery = `mutation {
    addSchoolSessionOtp(
        input: { otp: ${otp}}
        batchSessionConnectId: "${batchSessionId}"
    ) {
        id
    }
    }
    `;
  const result = await callLocalGraphqlApi(addQuery);
  return get(result, 'data.addSchoolSessionOtp', null);
};

const addSchoolSessionOtpInBatchSession = async (batchId) => {
  const batchSessions = await getBatchSessions(batchId);
  const finalOtpMap = await arrayCombinations([batchId]);
  for (const batchSession of batchSessions) {
    const isAlreadyCreated = get(batchSession, 'schoolSessionsOtp', []).length;
    const batchType = get(batchSession, 'batch.type');
    if (!isAlreadyCreated && finalOtpMap[batchId] && batchType === 'b2b') {
      addSchoolSessionOtp({
        otp: finalOtpMap[batchId], batchSessionId: get(batchSession, 'id'),
      });
      log(`Creating schoolSessionOtp for batch ${batchId} with OTP: ${finalOtpMap[batchId]} for batchSession: ${get(batchSession, 'id')} from addStudentProfile postHook method`);
    }
  }
};

export default addSchoolSessionOtpInBatchSession;

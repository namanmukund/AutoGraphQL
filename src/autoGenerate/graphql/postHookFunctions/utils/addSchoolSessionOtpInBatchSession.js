/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import moment from 'moment';
import { log } from '../../../../../utils';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import findSectionAndGradeCombination from './findSectionAndGradeCombination';

const getBatchSessions = async (batchId, grade, section) => {
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
      schoolSessionsOtp(
        filter: { and: [{ grade_not: ${grade} }, { section_not: ${section} }] }
      ) {
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
  otp, grade, section, batchSessionId,
}) => {
  const addQuery = `mutation {
    addSchoolSessionOtp(
        input: { otp: ${otp}, grade: ${grade}, section: ${section} }
        batchSessionConnectId: "${batchSessionId}"
    ) {
        id
    }
    }
    `;
  const result = await callLocalGraphqlApi(addQuery);
  return get(result, 'data.addSchoolSessionOtp', null);
};

const addSchoolSessionOtpInBatchSession = async (batchId, grade, section) => {
  const batchSessions = await getBatchSessions(batchId, grade, section);
  const gradeSectionCombination = findSectionAndGradeCombination(section, grade);
  for (const batchSession of batchSessions) {
    const isAlreadyCreated = get(batchSession, 'schoolSessionsOtp', []).find((sessionOtp) => findSectionAndGradeCombination(get(sessionOtp, 'section'), get(sessionOtp, 'grade'))
          === gradeSectionCombination);
    if (!isAlreadyCreated) {
      const finalOtpMap = await arrayCombinations([grade], [section]);
      if (finalOtpMap[gradeSectionCombination]) {
        addSchoolSessionOtp({
          otp: finalOtpMap[gradeSectionCombination], grade, section, batchSessionId: get(batchSession, 'id'),
        });
        log(`Creating schoolSessionOtp for grade ${grade}, section ${section} with OTP: ${finalOtpMap[gradeSectionCombination]} for batchSession: ${get(batchSession, 'id')} from addStudentProfile postHook method`);
      }
    }
  }
};

export default addSchoolSessionOtpInBatchSession;

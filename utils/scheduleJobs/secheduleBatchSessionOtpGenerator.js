/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import { log } from '..';
import callLocalGraphqlApi from '../../src/api/callLocalGraphqlApi';
import findSectionAndGradeCombination from '../../src/autoGenerate/graphql/postHookFunctions/utils/findSectionAndGradeCombination';
import arrayCombinations from '../../src/autoGenerate/graphql/postHookFunctions/utils/generateOtpMap';

const getBatchSessions = async () => {
  const dt = new Date().setHours(0, 0, 0, 0);
  const todayParsedDate = new Date(dt).toISOString();
  const hourValue = new Date().getHours();
  const addOtpSlot = (hourValue + 2) <= 23 ? hourValue + 2 : 0;
  const tomorrow = new Date(dt);
  const yesterDayDate = new Date(dt);
  tomorrow.setDate(tomorrow.getDate() + 1);
  yesterDayDate.setDate(yesterDayDate.getDate() - 1);
  const tomorrowParsedDate = tomorrow.toISOString();
  const deleteOtpSlot = (hourValue - 2) < 0 ? 23 : hourValue - 2;
  const batchSessionQuery = `{
    addOtp: batchSessions(
          filter: { and: [
          { bookingDate: "${addOtpSlot === 0 ? tomorrowParsedDate : todayParsedDate}" },
          {slot${addOtpSlot}:true},
      ] }
      ) {
        id
        attendance {
        student {
            id
            grade
            section
        }
        }
        schoolSessionsOtp {
        id
        grade
        section
        }
    }
    deleteOtp: batchSessions  (
      filter: { and: [
          { bookingDate: "${deleteOtpSlot === 23 ? yesterDayDate : todayParsedDate}" },
          {slot${addOtpSlot}:true},
          { schoolSessionsOtp_exists: true }
      ] }
  ) {
        id
        schoolSessionsOtp {
        id
        }
    }
    }
    `;
  const res = await callLocalGraphqlApi(batchSessionQuery);
  return {
    addOtpBatchSessions: get(res, 'data.addOtp', []),
    deleteOtpBatchSessions: get(res, 'data.deleteOtp', []),
  };
};

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

const scheduleBatchSessionOtpGenerator = async () => {
  const { addOtpBatchSessions = [], deleteOtpBatchSessions = [] } = await getBatchSessions();
  let i = 0;
  for (const batchSession of addOtpBatchSessions) {
    if (get(batchSession, 'attendance', []).length) {
      if (i >= 10) break;
      const uniqueGradesArray = [];
      const uniqueSectionsArray = [];
      const otpMapArray = [];
      const schoolSessionOtpArray = get(batchSession, 'schoolSessionsOtp', []);
      for (const student of get(batchSession, 'attendance', [])) {
        if (get(student, 'student.id') && get(student, 'student.grade') && get(student, 'student.section')) {
          if (!uniqueGradesArray.includes(get(student, 'student.grade'))) uniqueGradesArray.push(get(student, 'student.grade'));
          if (!uniqueSectionsArray.includes(get(student, 'student.section'))) uniqueSectionsArray.push(get(student, 'student.section'));
          const gradeSectionCombination = findSectionAndGradeCombination(get(student, 'student.section'), get(student, 'student.grade'));
          const isExist = otpMapArray.find((otpObj) => otpObj.gradeSectionCombination === gradeSectionCombination);
          const isAlreadyCreated = schoolSessionOtpArray.find((sessionOtp) => findSectionAndGradeCombination(get(sessionOtp, 'section'), get(sessionOtp, 'grade'))
          === gradeSectionCombination);
          if (!isExist && !isAlreadyCreated) {
            otpMapArray.push({
              grade: get(student, 'student.grade'),
              section: get(student, 'student.section'),
              otp: 0,
              gradeSectionCombination,
            });
          }
        }
      }
      const finalOtpMap = await arrayCombinations(uniqueGradesArray, uniqueSectionsArray);
      otpMapArray.forEach((otpObj) => {
        if (finalOtpMap[get(otpObj, 'gradeSectionCombination')]) {
          otpObj.otp = finalOtpMap[get(otpObj, 'gradeSectionCombination')];
        }
      });
      otpMapArray.forEach((otpObj) => {
        addSchoolSessionOtp({ ...otpObj, batchSessionId: get(batchSession, 'id') });
        log(`Creating schoolSessionOtp for grade ${otpObj.grade}, section ${otpObj.section} with OTP: ${otpObj.otp} for batchSession: ${get(batchSession, 'id')}`);
      });
      i += 1;
    }
  }
  for (const batchSession of deleteOtpBatchSessions) {
    if (get(batchSession, 'schoolSessionsOtp', []).length) {
      for (const sessionOtp of get(batchSession, 'schoolSessionsOtp', [])) {
        deleteSchoolSessionOtp(get(sessionOtp, 'id'));
        log(`Deleting schoolSessionOtp: ${get(sessionOtp, 'id')} in batchSession ${get(batchSession, 'id')}`);
      }
    }
  }
};

export default scheduleBatchSessionOtpGenerator;

/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-loop-func */
import { get } from 'lodash';
import { log } from '../../../../../utils';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import findSectionAndGradeCombination from './findSectionAndGradeCombination';
import arrayCombinations from './generateOtpMap';

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

const generateOtpForBatchSession = async (batchSessionId, students = []) => {
  if (students.length) {
    const uniqueGradesArray = [];
    const uniqueSectionsArray = [];
    const otpMapArray = [];
    for (const student of students) {
      if (get(student, 'grade') && get(student, 'section')) {
        if (!uniqueGradesArray.includes(get(student, 'grade'))) uniqueGradesArray.push(get(student, 'grade'));
        if (!uniqueSectionsArray.includes(get(student, 'section'))) uniqueSectionsArray.push(get(student, 'section'));
        const gradeSectionCombination = findSectionAndGradeCombination(get(student, 'section'), get(student, 'grade'));
        const isExist = otpMapArray.find((otpObj) => otpObj.gradeSectionCombination === gradeSectionCombination);
        if (!isExist) {
          otpMapArray.push({
            grade: get(student, 'grade'),
            section: get(student, 'section'),
            otp: 0,
            gradeSectionCombination,
          });
        }
      }
    }
    if (otpMapArray.length) {
      const finalOtpMap = await arrayCombinations(uniqueGradesArray, uniqueSectionsArray);
      otpMapArray.forEach((otpObj) => {
        if (finalOtpMap[get(otpObj, 'gradeSectionCombination')]) {
          otpObj.otp = finalOtpMap[get(otpObj, 'gradeSectionCombination')];
        }
      });
      otpMapArray.forEach((otpObj) => {
        addSchoolSessionOtp({ ...otpObj, batchSessionId });
        log(`Creating schoolSessionOtp for grade ${otpObj.grade}, section ${otpObj.section} with OTP: ${otpObj.otp} for batchSession: ${batchSessionId}`);
      });
    }
  }
};

export default generateOtpForBatchSession;

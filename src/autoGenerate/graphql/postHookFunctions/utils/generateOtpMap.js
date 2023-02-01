/* eslint-disable no-return-await */
/* eslint-disable no-await-in-loop */
import { get } from 'lodash';
import { rangeOTP } from '../../../../../constants';
import { getRandomNumber } from '../../../../../utils';
import getRandomTextOtp from '../../../../../utils/getRandomTextOtp';
import { callLocalGraphqlApi } from '../../../../api';
import checkIfOtpPresent from './checkIfOtpPresent';

const getBatchClassGrade = async (batchId) => {
  const query = `
    query{
      batch(id: "${batchId}") {
        classes {
          grade
        }
      }
    }
`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.batch.classes[0].grade');
};

// recursive function which checks if the otp already exists
const finalOtp = async (otpMap = {}, grade = null) => {
  let otp = null;
  if (grade && grade >= 4) {
    otp = getRandomTextOtp();
  } else {
    otp = getRandomNumber(rangeOTP.min, rangeOTP.max);
  }
  const alreadyExists = await checkIfOtpPresent(otp);
  if (!Object.values(otpMap).includes(otp) && !alreadyExists) {
    return otp;
  }
  return await finalOtp(otpMap, grade);
};

// finding all combinations on the basis of grade and section combination
const arrayCombinations = async (uniqueBatchIdsArray = []) => {
  const otpMap = {};
  for (let batchIdPointer = 0; batchIdPointer < uniqueBatchIdsArray.length; batchIdPointer += 1) {
    const batchId = uniqueBatchIdsArray[batchIdPointer];
    const grade = await getBatchClassGrade(batchId);
    let gradeNumber = null;
    if (grade) {
      const gradeNumArr = grade.split('Grade');
      gradeNumber = gradeNumArr.length && gradeNumArr[1];
    }
    otpMap[uniqueBatchIdsArray[batchIdPointer]] = await finalOtp(otpMap, gradeNumber);
  }
  return otpMap;
};

export default arrayCombinations;

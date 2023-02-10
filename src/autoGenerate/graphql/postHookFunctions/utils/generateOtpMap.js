/* eslint-disable no-return-await */
/* eslint-disable no-await-in-loop */
import { get } from 'lodash';
import { rangeOTP } from '../../../../../constants';
import { getRandomNumber } from '../../../../../utils';
import getRandomTextOtp from '../../../../../utils/getRandomTextOtp';
import { callLocalGraphqlApi } from '../../../../api';
import checkIfOtpPresent from './checkIfOtpPresent';

const getSchoolSessionOtp = async () => {
  const query = `
    query{
      schoolSessionOtpsMeta {
        count
      }
    }
`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.schoolSessionOtpsMeta.count');
};

// recursive function which checks if the otp already exists
const finalOtp = async (otpMap = {}) => {
  const otpCount = await getSchoolSessionOtp();
  let otp = null;
  if (otpCount > 10000) {
    otp = getRandomTextOtp();
  } else {
    otp = getRandomNumber(rangeOTP.min, rangeOTP.max);
  }
  otp = otp.toString();
  const alreadyExists = await checkIfOtpPresent(otp);
  if (!Object.values(otpMap).includes(otp) && !alreadyExists) {
    return otp;
  }
  return await finalOtp(otpMap);
};

// finding all combinations on the basis of grade and section combination
const arrayCombinations = async (uniqueBatchIdsArray = []) => {
  const otpMap = {};
  for (let batchIdPointer = 0; batchIdPointer < uniqueBatchIdsArray.length; batchIdPointer += 1) {
    otpMap[uniqueBatchIdsArray[batchIdPointer]] = await finalOtp(otpMap);
  }
  return otpMap;
};

export default arrayCombinations;

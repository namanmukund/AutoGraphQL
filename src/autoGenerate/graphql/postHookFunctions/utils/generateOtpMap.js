/* eslint-disable no-return-await */
/* eslint-disable no-await-in-loop */
import { rangeOTP } from '../../../../../constants';
import { getRandomNumber } from '../../../../../utils';
import checkIfOtpPresent from './checkIfOtpPresent';

// recursive function which checks if the otp already exists
const finalOtp = async (otpMap = {}) => {
  const otp = getRandomNumber(rangeOTP.min, rangeOTP.max);
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

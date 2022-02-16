import { rangeOTP } from '../../../../../constants';
import grades from '../../../../../constants/grades';
import { getRandomNumber } from '../../../../../utils';
import checkIfOtpPresent from './checkIfOtpPresent';

// recursive function which checks if the otp already exists
const finalOtp = (otpMap) => {
  const otp = getRandomNumber(rangeOTP.min, rangeOTP.max);
  const alreadyExists = checkIfOtpPresent(otp);
  if (!Object.values(otpMap).includes(otp) && !alreadyExists) {
    return otp;
  }
  return finalOtp(otpMap);
};

// finding all combinations on the basis of grade and section combination
const arrayCombinations = () => {
  const otpMap = {};
  for (let sectionPointer = 0; sectionPointer < 26; sectionPointer += 1) {
    for (let gradePointer = 1; gradePointer < grades.length + 1; gradePointer += 1) {
      const section = String.fromCharCode(sectionPointer + 65);
      otpMap[section + gradePointer] = finalOtp();
    }
  }
  return otpMap;
};

export default arrayCombinations;

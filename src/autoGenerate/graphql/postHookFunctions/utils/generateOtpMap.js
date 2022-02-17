/* eslint-disable no-return-await */
/* eslint-disable no-await-in-loop */
import { rangeOTP } from '../../../../../constants';
import { getRandomNumber } from '../../../../../utils';
import checkIfOtpPresent from './checkIfOtpPresent';
import findSectionAndGradeCombination from './findSectionAndGradeCombination';

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
const arrayCombinations = async (uniqueGradesArray = [], uniqueSectionsArray = []) => {
  const otpMap = {};
  for (let sectionPointer = 0; sectionPointer < uniqueSectionsArray.length; sectionPointer += 1) {
    for (let gradePointer = 0; gradePointer < uniqueGradesArray.length; gradePointer += 1) {
      const gradeSectionCombination = findSectionAndGradeCombination(uniqueSectionsArray[sectionPointer], uniqueGradesArray[gradePointer]);
      otpMap[gradeSectionCombination] = await finalOtp(otpMap);
    }
  }
  return otpMap;
};

export default arrayCombinations;

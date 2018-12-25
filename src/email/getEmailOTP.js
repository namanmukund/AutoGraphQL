import getRandomNumber from '../../utils/getRandomNumber';
import { rangeOTP } from '../../constants';

const getEmailOTP = (hookInput) => {
  const { email } = hookInput;
  if (email) {
    const emailOtp = getRandomNumber(rangeOTP.min, rangeOTP.max);
    Object.assign(hookInput, { emailOtp });
  }
  return hookInput;
};

export default getEmailOTP;

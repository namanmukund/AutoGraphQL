import getRandomNumber from '../../utils/getRandomNumber';
import { rangeOTP } from '../../constants';

const getPhoneOTP = (hookInput) => {
  const { phone } = hookInput;
  if (phone) {
    const phoneOtp = getRandomNumber(rangeOTP.min, rangeOTP.max);
    Object.assign(hookInput, { phoneOtp });
  }
  return hookInput;
};

export default getPhoneOTP;

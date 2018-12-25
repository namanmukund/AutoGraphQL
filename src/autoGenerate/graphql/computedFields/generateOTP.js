import getRandomNumber from '../../../../utils/getRandomNumber';
import { rangeOTP } from '../../../../constants';

const generateOTP = () => getRandomNumber(rangeOTP.min, rangeOTP.max);

export default generateOTP;

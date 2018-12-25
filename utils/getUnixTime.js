import { InvalidDateFormatError } from '../constants/errors';
import parsedDate from './parsedDate';

const getUnixTime = (isoTimeString) => {
  if (isoTimeString && isoTimeString !== 'null') {
    try {
      return parsedDate(isoTimeString);
    } catch (err) {
      throw new InvalidDateFormatError({ data: { date: isoTimeString } });
    }
  }
  return null;
};

export default getUnixTime;

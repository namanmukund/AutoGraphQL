import { find } from 'lodash';
import { timeZones } from '../constants';

const getTimeZoneFromCountryCode = (countryCode) => {
  if (countryCode) {
    const obj = find(timeZones, { countryCode });
    if (obj) {
      const { timeZone } = obj;
      return timeZone;
    }
  }
  const { timeZone } = find(timeZones, { countryCode: '+91' });
  return timeZone;
};

export default getTimeZoneFromCountryCode;

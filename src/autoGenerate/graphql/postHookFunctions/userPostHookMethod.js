import { get } from 'lodash';
//
// const MaskData = require('maskdata');

/*
In post-hook we are masking data for pre prod users
*/
const userPostHookMethod = (input) => {
  if (process.env.DATA_MASKING) {
    if (Array.isArray(input) && input.length) {
      input.forEach((elem) => {
        const email = get(elem, 'email');
        const phoneNumber = get(elem, 'phone.number');
        // eslint-disable-next-line no-param-reassign
        elem.email = email ? email.replace(/^(.)(.*)(.@.*)$/,
          (_, a, b, c) => a + b.replace(/./g, '*') + c) : '';
        // eslint-disable-next-line no-param-reassign
        if (elem.phone) elem.phone.number = phoneNumber ? phoneNumber.replace(/\d(?=\d{4})/g, '*') : '';
      });
    } else {
      const email = get(input, 'email');
      const phoneNumber = get(input, 'phone.number');
      // eslint-disable-next-line no-param-reassign
      input.email = email ? email.replace(/^(.)(.*)(.@.*)$/,
        (_, a, b, c) => a + b.replace(/./g, '*') + c) : '';
      // eslint-disable-next-line no-param-reassign
      if (input.phone) input.phone.number = phoneNumber ? phoneNumber.replace(/\d(?=\d{4})/g, '*') : '';
    }
  }
  return input;
};

export default userPostHookMethod;

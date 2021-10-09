import { get } from 'lodash';
//
// const MaskData = require('maskdata');

/*
In post-hook we are masking data for pre prod users
*/
const userPostHookMethod = (input) => {
.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
  console.log('------------input.isArray', input.isArray);
  if (Array.isArray(input) && input.length) {
    input.forEach((elem) => {
      const email = get(elem, 'email');
      const phoneNumber = get(elem, 'phone.number');
      console.log('------------email 11111', email);
      // eslint-disable-next-line no-param-reassign
      elem.email = email ? email.replace(/^(.)(.*)(.@.*)$/,
        (_, a, b, c) => a + b.replace(/./g, '*') + c) : '';
      elem.phone.number = phoneNumber ? phoneNumber.replace(/^(.)(.*)(.@.*)$/,
          (_, a, b, c) => a + b.replace(/./g, '*') + c) : '';
      console.log('------------------------elem', elem);
    });
  } else {
    const email = get(input, 'email');
    const phoneNumber = get(input, 'phone.number');
    // eslint-disable-next-line no-param-reassign
    input.email = email ? email.replace(/^(.)(.*)(.@.*)$/,
      (_, a, b, c) => a + b.replace(/./g, '*') + c) : '';
    input.phone.number = phoneNumber ? phoneNumber.replace(/^(.)(.*)(.@.*)$/,
        (_, a, b, c) => a + b.replace(/./g, '*') + c) : '';
  }
  return input;
};

export default userPostHookMethod;

import libphonenumber from 'google-libphonenumber';

const getCountryCodeAndNumber = (input) => {
  const phoneUtil = libphonenumber.PhoneNumberUtil && libphonenumber.PhoneNumberUtil.getInstance();
  const phoneNumber = phoneUtil.parse(input);
  const countryCode = `+${phoneNumber.getCountryCode()}`;
  const number = input.replace(countryCode, '');
  return {
    countryCode,
    number,
  };
};

export default getCountryCodeAndNumber;

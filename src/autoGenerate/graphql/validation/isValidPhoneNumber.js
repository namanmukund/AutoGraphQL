import libphonenumber from 'google-libphonenumber';
/*
Validates country code, like +91 is correct and +919191 is not
and also checks if the starting number is valid or not like for +91,
Other checks like phone length is
also verified.
*/
const isValidPhoneNumber = (phoneDoc) => {
  const { countryCode, number } = phoneDoc;
  if (!countryCode || !number) {
    return false;
  }
  const phoneNumber = countryCode + number;
  const phoneUtil = libphonenumber.PhoneNumberUtil && libphonenumber.PhoneNumberUtil.getInstance();
  // Parse number in input.
  const parsedPhoneNumber = phoneUtil && phoneUtil.parseAndKeepRawInput(phoneNumber);
  // check if phone number is valid
  if (phoneUtil && !phoneUtil.isValidNumber(parsedPhoneNumber)) {
    return false;
  }
  return true;
};

export default isValidPhoneNumber;

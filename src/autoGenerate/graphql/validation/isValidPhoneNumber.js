import phone from 'phone';
/*
Validates country code, like +91 is correct and +919191 is not
and also checks if the starting number is valid or not like for +91,
number should start with 8 or 9. Other checks like phone length is
also verified.
*/
const isValidPhoneNumber = (phoneDoc) => {
  console.log(phoneDoc);
  const { countryCode, number } = phoneDoc;
  if (!countryCode || !number) {
    return false;
  }
  const phoneNumber = countryCode + number;
  const parsedPhoneNumber = phone(phoneNumber);
  if (!parsedPhoneNumber || !parsedPhoneNumber.length) {
    return false;
  }
  return true;
};

export default isValidPhoneNumber;

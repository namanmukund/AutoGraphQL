import isEmail from 'validator/lib/isEmail';

const isValidEmail = (email) => {
  if (!isEmail(email)) {
    return false;
  }
  return true;
};

export default isValidEmail;

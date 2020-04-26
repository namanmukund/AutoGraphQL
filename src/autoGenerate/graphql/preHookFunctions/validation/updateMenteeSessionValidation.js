import validateMenteeSessionInput from './utils/validateMenteeSessionInput';

const updateMenteeSessionValidation = async (params) => {
  // validate input
  validateMenteeSessionInput(params);
  return true;
};

export default updateMenteeSessionValidation;

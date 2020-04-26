import validateMentorSessionInput from './utils/validateMentorSessionInput';

const updateMentorSessionValidation = async (params) => {
  validateMentorSessionInput(params);
  return true;
};

export default updateMentorSessionValidation;

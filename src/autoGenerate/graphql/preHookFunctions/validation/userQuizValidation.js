import isComponentUnlocked from './utils/isComponentUnlocked';

// prehook logic to check if requested UserQuiz(user and topic id) is unlocked
const userQuizValidation = async (params, context) => {
  // check if the called user and topic is unlocked
  await isComponentUnlocked(
    params,
    '',
    context,
    'quiz',
  );
  return true;
};

export default userQuizValidation;

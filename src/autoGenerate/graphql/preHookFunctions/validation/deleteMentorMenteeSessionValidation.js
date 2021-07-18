import validateTokenAndExtractInformation from './utils/validateTokenAndExtractInformation';

const deleteMentorMenteeSessionValidation = async (newParams, mutationOrQueryName, context) => {
  const { mentorSessionConnectId } = newParams;
  // getting current user from context to send in logs
  const userInfo = validateTokenAndExtractInformation(context, false);
  const {
    currentUser,
  } = userInfo;
  // eslint-disable-next-line no-param-reassign
  context.currentUser = currentUser;
  context.mentorSessionConnectId = mentorSessionConnectId;
};

export default deleteMentorMenteeSessionValidation;

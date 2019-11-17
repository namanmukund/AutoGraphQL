import { sendForgotPasswordLinkToUser } from '../../../../../email/messages';

const sendEmailForSendForgotPasswordLink = (fetchedUser, authentication, forgotPassLink) => {
  const { email } = fetchedUser;
  const appName = authentication.app.name;
  sendForgotPasswordLinkToUser(email, forgotPassLink, appName);
  return null;
};

export default sendEmailForSendForgotPasswordLink;

import { sendForgotPasswordLinkToUser } from '../../../../../email/messages';

const sendEmailForSendForgotPasswordLink = (fetchedUser, authentication, forgotPassLink) => {
  const { email, name } = fetchedUser;
  const appName = authentication.app.name;
  sendForgotPasswordLinkToUser(email, forgotPassLink, appName, name);
  return null;
};

export default sendEmailForSendForgotPasswordLink;

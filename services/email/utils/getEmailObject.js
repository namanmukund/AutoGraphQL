import { fromEmail } from '../../../constants';

/* if html is empty then in the body text will be appear. Html is having higher
   precedence over text in subject */
// emailto should be in array. Can send the mail to mutiple people
// ccemail should be in array. Can send the mail to mutiple people
// bccemail should be in array. Can send the mail to mutiple people
const getEmailObject = (
  emailTo,
  ccEmail,
  bccEmail,
  subject,
  text,
  html,
  emailFromParam,
) => {
  const mailSubject = subject || text;
  const emailObject = {
    to: emailTo || [''],
    cc: ccEmail || [''],
    bcc: bccEmail || [''],
    from: emailFromParam || fromEmail,
    subject: mailSubject,
    html,
  };
  return emailObject;
};


export default getEmailObject;

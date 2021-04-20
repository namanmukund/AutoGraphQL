import { get } from 'lodash';
import sendTransactionalEmail from '../../resolvers/utils/sendTransactionalEmail';

const sendSavedCodeSubmittedMailIfRequestedByMentee = async (previousDocument) => {
  const parentEmail = get(previousDocument, 'user.studentProfile.parents[0].user.email');
  const mailId = get(previousDocument, 'user.email') || parentEmail;
  if (mailId) {
    const studentName = get(previousDocument, 'user.name', '');
    const templateObject = {
      parentEmail: mailId,
      fileName: get(previousDocument, 'fileName', ''),
      savedCode: encodeURIComponent(get(previousDocument, 'code', '')),
    };
    await sendTransactionalEmail(templateObject, {
      emailTemplate: 'savedCodeSubmittedForReviewEmailTemplate',
      subject: `Kudos ${studentName}, your code has been submitted and is in review`,
      whatsAppTemplate: '',
    }, 'india');
    return true;
  }
  return false;
};

export default sendSavedCodeSubmittedMailIfRequestedByMentee;

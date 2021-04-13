import { get } from 'lodash';
import sendTransactionalEmail from '../resolvers/utils/sendTransactionalEmail';
import { PUBLISHED, UNPUBLISHED } from '../../../../constants';

const updateUserApprovedCodePostHookMethod = async (input, _params, _mutationName, context) => {
  const { status: approvedCodeStatus } = input;
  const { previousDocument } = context;
  if (approvedCodeStatus === PUBLISHED && get(previousDocument, 'status') === UNPUBLISHED) {
    const studentName = get(previousDocument, 'studentName', '');
    const templateObject = {
      approvedCodeID: get(previousDocument, 'id'),
      parentEmail: get(previousDocument, 'user.email', ''),
      studentName,
      fileName: get(previousDocument, 'approvedFileName', ''),
      description: get(previousDocument, 'approvedDescription', ''),
      approvedCode: encodeURIComponent(get(previousDocument, 'approvedCode', '')),
    };
    await sendTransactionalEmail(templateObject,
      {
        emailTemplate: 'userSavedCodePublishedEmailTemplate',
        subject: `Congrats ${studentName}, your code has been published!`,
        whatsAppTemplate: '',
      }, 'india');
  }
};

export default updateUserApprovedCodePostHookMethod;

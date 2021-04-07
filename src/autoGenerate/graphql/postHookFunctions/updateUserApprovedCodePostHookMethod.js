import { get } from 'lodash';
import sendTransactionalEmail from '../resolvers/utils/sendTransactionalEmail';
import transactionalMessageBody from '../../../../constants/transactionalMessageBody';
import { PUBLISHED, UNPUBLISHED } from '../../../../constants';

const updateUserApprovedCodePostHookMethod = async (input, _params, _mutationName, context) => {
  const { status: approvedCodeStatus } = input;
  const { previousDocument } = context;
  if (approvedCodeStatus === PUBLISHED && get(previousDocument, 'status') === UNPUBLISHED) {
    const templateObject = {
      approvedCodeID: get(previousDocument, 'id'),
      parentEmail: get(previousDocument, 'user.email'),
      studentName: get(previousDocument, 'studentName'),
      fileName: get(previousDocument, 'approvedFileName'),
      description: get(previousDocument, 'approvedDescription'),
      codeImageLink: 'https://sourcecodeshots.com/image/EgLdZ26qazSz8UxCY8de.png',
    };
    await sendTransactionalEmail(templateObject, transactionalMessageBody.userSavedCodePublished, 'india');
  }
};

export default updateUserApprovedCodePostHookMethod;

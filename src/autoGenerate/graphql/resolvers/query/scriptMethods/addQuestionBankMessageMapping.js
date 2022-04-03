/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import { QueryController, MutationController } from '../../../controllers';

const getMessageData = [
  {
    $match: {
      'question.typeId': {
        $exists: true,
      },
    },
  },
  {
    $project: {
      _id: 0,
    },
  },
];

const addQuestionBankMessageMapping = async () => {
  const newAuthentication = {
    bypass: true,
  };

  const messageQueries = new QueryController('Message', newAuthentication);
  const questionBankMutation = new MutationController('QuestionBank', newAuthentication);
  const messageData = await messageQueries.aggregate(getMessageData);

  if (messageData && messageData.length) {
    for (const message of messageData) {
      await questionBankMutation.update({ id: get(message, 'question.typeId', null) },
        {
          message: {
            type: 'Message',
            typeId: message.id,
          },
        });
    }
  }
  return true;
};

export default addQuestionBankMessageMapping;

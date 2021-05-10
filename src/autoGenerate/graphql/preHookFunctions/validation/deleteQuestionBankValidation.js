import { get } from 'lodash';
import { QuestionIsPublishedError } from '../../../../../constants/errors';
import { PUBLISHED } from '../../../../../constants';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const deleteQuestionBankValidation = async (params) => {
  const { id: questionId } = params;
  const query = `
        {
          questionBanksMeta(filter: {and: [{id: "${questionId}"}, {status: ${PUBLISHED}}]}) {
            count
          }
        }
        `;

  const res = await callLocalGraphqlApi(query);
  const isPublished = get(res, 'data.questionBanksMeta.count', 0);
  if (isPublished) {
    throw new QuestionIsPublishedError();
  }
  return true;
};

export default deleteQuestionBankValidation;

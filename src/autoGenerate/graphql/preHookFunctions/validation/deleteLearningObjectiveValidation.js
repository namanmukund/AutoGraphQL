import { get } from 'lodash';
import { PUBLISHED } from '../../../../../constants';
import checkDeleteStatusOfALearningObjective from './utils/checkDeleteStatusOfALearningObjective';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const deleteLearningObjectiveValidation = async (params) => {
  const { id: learningObjectiveId } = params;
  const query = `
        {
            learningObjective(id: "${learningObjectiveId}") {
              id
              status
              messageStatus
              questionBankMeta(filter: {status: ${PUBLISHED}}) {
                count
              }
            }
        }
`;

  const res = await callLocalGraphqlApi(query);
  const learningObjective = get(res, 'data.learningObjective');
  if (learningObjective) {
    checkDeleteStatusOfALearningObjective(learningObjective);
  }
  return true;
};


export default deleteLearningObjectiveValidation;

import { get } from 'lodash';
import callGraphqlApi from '../../../../api/callGraphqlApi';
import { PUBLISHED } from '../../../../../constants';
import checkDeleteStatusOfALearningObjective from './utils/checkDeleteStatusOfALearningObjective';

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

  const res = await callGraphqlApi(query);
  const learningObjective = get(res, 'data.learningObjective');
  if (learningObjective) {
    checkDeleteStatusOfALearningObjective(learningObjective);
  }
  return true;
};


export default deleteLearningObjectiveValidation;

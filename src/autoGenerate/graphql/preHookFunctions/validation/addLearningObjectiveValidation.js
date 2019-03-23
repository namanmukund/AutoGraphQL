import { get } from 'lodash';
import {
  OrderAlreadyExistsError,
  TopicIdRequiredError,
} from '../../../../../constants/errors';
import callGraphqlApi from '../../../../api/callGraphqlApi';

const addLearningObjectiveValidation = async (params) => {
  const { topicConnectId: id } = params;
  if (!id) {
    throw new TopicIdRequiredError();
  }
  const order = params.input.order;
  const query = `
  query{
  topic(id:"${id}"){
    learningObjectives{
      order
    }
  }
 }
`;

  const res = await callGraphqlApi(query);
  const learningObjectives = get(res, 'data.topic.learningObjectives');
  if (learningObjectives) {
    learningObjectives.forEach((lo) => {
      if (lo.order === order) {
        throw new OrderAlreadyExistsError();
      }
    });
  }
  return true;
};

export default addLearningObjectiveValidation;

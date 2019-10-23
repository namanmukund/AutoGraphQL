/* eslint no-restricted-syntax: ["error", "FunctionExpression", "WithStatement",
"BinaryExpression[operator='in']"] */
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
  const { order } = params.input;
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
    for (const learningObjective of learningObjectives) {
      if (learningObjective.order === order) {
        throw new OrderAlreadyExistsError();
      }
    }
  }
  return true;
};

export default addLearningObjectiveValidation;

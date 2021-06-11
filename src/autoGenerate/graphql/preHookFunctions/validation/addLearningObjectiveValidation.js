/* eslint no-restricted-syntax: ["error", "FunctionExpression", "WithStatement",
"BinaryExpression[operator='in']"] */
import { get } from 'lodash';
import {
  OrderAlreadyExistsError,
} from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const addLearningObjectiveValidation = async (params) => {
  const { topicConnectId: id } = params;
  // if (!id) {
  //   throw new TopicIdRequiredError();
  // }
  if (id) {
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

    const res = await callLocalGraphqlApi(query);
    const learningObjectives = get(res, 'data.topic.learningObjectives');
    if (learningObjectives) {
      for (const learningObjective of learningObjectives) {
        if (learningObjective.order === order) {
          throw new OrderAlreadyExistsError();
        }
      }
    }
    return true;
  }
  return true;
};

export default addLearningObjectiveValidation;

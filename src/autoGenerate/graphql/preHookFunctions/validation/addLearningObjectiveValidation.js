/* eslint no-restricted-syntax: ["error", "FunctionExpression", "WithStatement",
"BinaryExpression[operator='in']"] */
import { get } from 'lodash';
import {
  LOWithSimilarTitleAlreadyExist,
  OrderAlreadyExistsError,
} from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

export const fetchLO = async (courseIds, order, title, LoFilter) => {
  const query = `{
    learningObjectives(
      filter: { and: [
        ${courseIds ? `{ courses_some: { id_in: [${courseIds}] } }` : ''}
        ${order ? `{ order: ${order} }` : ''}
        ${title ? `{title: "${title}"}` : ''}
        ${LoFilter || ''}
      ] }
    ) {
      id
    }
  }`;
  const loData = await callLocalGraphqlApi(query);
  return get(loData, 'data.learningObjectives');
};

const addLearningObjectiveValidation = async (params) => {
  const { topicConnectId: id, coursesConnectIds = [], input = {} } = params;
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
  const order = get(input, 'order');
  const title = get(input, 'title');
  if (title || order) {
    let courseIds = '';
    coursesConnectIds.forEach((courseId) => { courseIds += `"${courseId}"`; });
    if (order) {
      const LoData = await fetchLO(courseIds, order);
      if (LoData && LoData.length > 0) {
        throw new OrderAlreadyExistsError();
      }
    }
    if (title) {
      const LoData = await fetchLO(courseIds, null, title);
      if (LoData && LoData.length > 0) {
        throw new LOWithSimilarTitleAlreadyExist();
      }
    }
  }
  return true;
};

export default addLearningObjectiveValidation;

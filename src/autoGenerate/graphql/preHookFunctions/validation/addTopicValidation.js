import { get } from 'lodash';
import {
  TopicWithSimilarOrderAlreadyExist,
  TopicWithSimilarTitleAlreadyExist, MissingMandatoryInputInRequestError,
} from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

export const getTopicsData = async (courseIds, title, order, topicFilter) => {
  const query = `{
  topics(filter:{ and:[ ${courseIds ? `{ courses_some:{ id_in:[${courseIds}] } }` : ''}
  ${title ? `{ title: "${title}" }` : ''}
  ${order ? `{ order: ${order} }` : ''}
  ${topicFilter || ''}
] }) {
    id
  }
    }`;
  const topicsData = await callLocalGraphqlApi(query);
  return get(topicsData, 'data.topics');
};

const addTopicValidation = async (params) => {
  const { coursesConnectIds = [], input: { title, order } } = params;
  if (coursesConnectIds.length === 0) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'Course Ids is missing in input',
      },
    });
  }
  if (title || order) {
    let courseIds = '';
    coursesConnectIds.forEach((courseId) => { courseIds += `"${courseId}"`; });
    // check if the topic with similar title exist
    if (title) {
      const topicsDataForTitle = await getTopicsData(courseIds, title);
      if (topicsDataForTitle && topicsDataForTitle.length > 0) {
        throw new TopicWithSimilarTitleAlreadyExist();
      }
    }
    // check if the topic with similar order exist
    if (order) {
      const topicsDataForTitle = await getTopicsData(courseIds, null, order);
      if (topicsDataForTitle && topicsDataForTitle.length > 0) {
        throw new TopicWithSimilarOrderAlreadyExist();
      }
    }
  }
  return true;
};

export default addTopicValidation;

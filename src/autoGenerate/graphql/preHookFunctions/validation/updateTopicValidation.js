import { get } from 'lodash';
import { TopicWithSimilarOrderAlreadyExist, TopicWithSimilarTitleAlreadyExist } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { getTopicsData } from './addTopicValidation';

const fetchCoursesFromTopic = async (topicId) => {
  const query = `{
  topic(id:"${topicId}"){
    id
    courses{
      id
    }
  }
}`;
  const topicData = await callLocalGraphqlApi(query);
  return get(topicData, 'data.topic', {});
};

const updateTopicValidation = async (params) => {
  const { input: { title, order }, id: topicId } = params;
  if (title || order) {
    let courseIds = '';
    const topicData = await fetchCoursesFromTopic(topicId);
    if (topicData) {
      get(topicData, 'courses', []).forEach((course) => { courseIds += `"${get(course, 'id')}"`; });
    }
    // check if the topic with similar title exist
    const topicFilter = `{ id_not:"${topicId}" }`;
    if (title) {
      const topicsDataForTitle = await getTopicsData(courseIds, title, null, topicFilter);
      if (topicsDataForTitle && topicsDataForTitle.length > 0) {
        throw new TopicWithSimilarTitleAlreadyExist();
      }
    }
    // check if the topic with similar order exist
    if (order) {
      const topicsDataForTitle = await getTopicsData(courseIds, null, order, topicFilter);
      if (topicsDataForTitle && topicsDataForTitle.length > 0) {
        throw new TopicWithSimilarOrderAlreadyExist();
      }
    }
  }
  return true;
};

export default updateTopicValidation;

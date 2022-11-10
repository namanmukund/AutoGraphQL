import { get } from 'lodash';
import { TopicWithSimilarOrderAlreadyExist, TopicWithSimilarTitleAlreadyExist } from '../../../../../constants/errors';
import { getTopicsData } from './addTopicValidation';

const updateTopicValidation = async (params) => {
  const { input, id: topicId, coursesConnectIds = [] } = params;
  const title = get(input, 'title');
  const order = get(input, 'order');
  if (title || order) {
    if (coursesConnectIds.length > 0) {
      let courseIds = '';
      coursesConnectIds.forEach((courseId) => { courseIds += `"${courseId}"`; });
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
  }
  return true;
};

export default updateTopicValidation;

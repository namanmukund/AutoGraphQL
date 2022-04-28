import { get } from 'lodash';

const getSortedTopics = (topicRules) => {
  topicRules.map((rule) => !get(rule, 'isRevision'));
  topicRules.sort((a, b) => a.order - b.order);
  const topics = topicRules.map((e) => ({
    ...e.topic,
    coursePackageOrder: e.order,
  }));
  return topics;
};

export default getSortedTopics;

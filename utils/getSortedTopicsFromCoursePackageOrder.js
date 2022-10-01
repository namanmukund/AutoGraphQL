import { get } from 'lodash';

const getSortedTopics = (topicRules) => {
  if (!topicRules || !topicRules.length) return [];
  const topicRulesFiltered = topicRules.filter((rule) => !get(rule, 'isRevision'));
  topicRulesFiltered.sort((a, b) => a.order - b.order);
  const topics = topicRulesFiltered.map((e) => ({
    ...e.topic,
    coursePackageOrder: e.order,
  }));
  return topics;
};

export default getSortedTopics;

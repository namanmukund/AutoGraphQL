const getSortedTopics = (topicRules) => {
  topicRules.sort((a, b) => a.order - b.order);
  const topics = topicRules.map((e) => ({
    ...e.topic,
    coursePackageOrder: e.order,
  }));
  return topics;
};

export default getSortedTopics;

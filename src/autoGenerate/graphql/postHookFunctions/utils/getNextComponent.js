import { topicTypes } from '../../../../../constants';

/*
method to get next component query whenever userLearningObjective, userVideo or userQuiz
gets created
*/
const getNextComponent = (
  learningObjectiveId,
  topicId,
  page,
) => {
  const { video, message, quiz } = topicTypes;
  let nextComponentQuery = '';
  let nextCurrentTopicComponentType;
  let learningObjectiveConnectIdQuery = '';
  let topicConnectIdQuery = '';
  // case for userLearningObjective collection
  if (page === 'learningObjective') {
    // if next LO is not present in that case, quiz will be next component
    if (learningObjectiveId) {
      nextCurrentTopicComponentType = message;
    } else {
      nextCurrentTopicComponentType = quiz;
    }
  // case for userQuiz collection
  } else if (page === 'quiz') {
    nextCurrentTopicComponentType = video;
  // case for userQuiz collection
  } else if (page === 'video') {
    // next component will be chat of first published LO
    nextCurrentTopicComponentType = message;
  }
  if (learningObjectiveId) { learningObjectiveConnectIdQuery = `learningObjectiveConnectId:"${learningObjectiveId}"`; }
  if (topicId) { topicConnectIdQuery = `topicConnectId:"${topicId}"`; }
  if (learningObjectiveId || topicId) {
    nextComponentQuery = `nextComponent:{
                     ${learningObjectiveConnectIdQuery}
                     ${topicConnectIdQuery}
                     nextComponentType: ${nextCurrentTopicComponentType}
                   }`;
  }
  return nextComponentQuery;
};

export default getNextComponent;

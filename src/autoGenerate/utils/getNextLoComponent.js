import { get } from 'lodash';
import { topicTypes } from '../../../constants';

const {
  message, practiceQuestion, comicStrip, learningSlide,
} = topicTypes;

const getNextLoComponent = (componentRule) => {
  let currentTopicComponentType = message;
  const messageCount = get(componentRule, 'learningObjective.messagesMeta.count', 0);
  const pqCount = get(componentRule, 'learningObjective.questionBankMeta.count', 0);
  const comicStripCount = get(componentRule, 'learningObjective.comicStripsMeta.count', 0);
  const learningSlidesCount = get(componentRule, 'learningObjective.learningSlidesMeta.count', 0);
  const learningObjectiveComponentsRule = (get(componentRule, 'learningObjectiveComponentsRule', []) || [])
    .sort((firstItem, secondItem) => firstItem.order - secondItem.order);
  if (learningObjectiveComponentsRule.length) {
    currentTopicComponentType = get(learningObjectiveComponentsRule, '[0].componentName');
  } else if (messageCount) {
    currentTopicComponentType = message;
  } else if (pqCount) {
    currentTopicComponentType = practiceQuestion;
  } else if (comicStripCount) {
    currentTopicComponentType = comicStrip;
  } else if (learningSlidesCount) {
    currentTopicComponentType = learningSlide;
  }
  return currentTopicComponentType;
};

export default getNextLoComponent;

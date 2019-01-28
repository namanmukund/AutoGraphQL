/* eslint no-restricted-syntax: ["error", "FunctionExpression", "WithStatement",
"BinaryExpression[operator='in']"] */
import isDocContainsGivenKeyValue from '../../../../utils/isDocContainsGivenKeyValue';
import { PUBLISHED } from '../../../../../../constants';
import checkDeleteStatusOfALearningObjective from './checkDeleteStatusOfALearningObjective';
import { TopicIsPublishedError, VideoIsPublishedError } from '../../../../../../constants/errors';

const checkDeleteStatusOfATopic = (topic) => {
  // prevent delete if topic status is published
  if (isDocContainsGivenKeyValue(topic, 'status', PUBLISHED)) {
    throw new TopicIsPublishedError();
  }
  // videoStatus
  if (isDocContainsGivenKeyValue(topic, 'videoStatus', PUBLISHED)) {
    throw new VideoIsPublishedError();
  }
  // learningObjectives
  const { learningObjectives } = topic;
  if (!learningObjectives || !learningObjectives.length) {
    return null;
  }
  for (const learningObjective of learningObjectives) {
    checkDeleteStatusOfALearningObjective(learningObjective);
  }
  return null;
};

export default checkDeleteStatusOfATopic;

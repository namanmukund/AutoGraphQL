import isDocContainsGivenKeyValue from '../../../../utils/isDocContainsGivenKeyValue';
import { PUBLISHED } from '../../../../../../constants';
import {
  LearningObjectiveIsPublishedError,
  MessageIsPublishedError,
  QuestionIsPublishedError,
} from '../../../../../../constants/errors';

const checkDeleteStatusOfALearningObjective = (learningObjective) => {
  // prevent delete if learningObjective status is published
  if (isDocContainsGivenKeyValue(learningObjective, 'status', PUBLISHED)) {
    throw new LearningObjectiveIsPublishedError();
  }
  // prevent delete if learningObjective messageStatus is published
  if (isDocContainsGivenKeyValue(learningObjective, 'messageStatus', PUBLISHED)) {
    throw new MessageIsPublishedError();
  }
  const { questionBankMeta: { count } } = learningObjective;
  if (count && count > 0) {
    throw new QuestionIsPublishedError();
  }
};

export default checkDeleteStatusOfALearningObjective;

import { get } from 'lodash';
import { log } from '../../../../../utils';
import { UserOrLearningObjectiveNotPresentError } from '../../../../../constants/errors';

const getInfoFromParams = (params, page) => {
  const filterArray = get(params, 'filter.and');
  if (!filterArray) {
    throw new UserOrLearningObjectiveNotPresentError();
  }
  const userSome = filterArray.find(filterElem => filterElem.user_some);
  const loSome = filterArray.find(filterElem => filterElem.learningObjective_some);
  const topicSome = filterArray.find(filterElem => filterElem.topic_some);
  const userId = get(userSome, 'user_some.id');
  const topicId = get(topicSome, 'topic_some.id');
  const learningObjectiveId = get(loSome, 'learningObjective_some.id');
  if (!userId) {
    log('userId is missing in input of postHook');
  }
  if (page === 'chat' && !learningObjectiveId) {
    log('LearningObjectiveId is missing in input of postHook');
  } else if ((page === 'video' || page === 'quiz') && !topicId) {
    log('TopicId is missing in input of postHook');
  }
  return {
    userId,
    learningObjectiveId,
    topicId,
  };
};

export default getInfoFromParams;

import { get } from 'lodash';
import { log } from '../../../../../utils';

const getInfoFromParams = (params, page) => {
  let userId;
  let topicId;
  let learningObjectiveId;
  let courseId;
  let videoId;
  const filterArray = get(params, 'filter.and');
  if (filterArray) {
    const userSome = filterArray.find((filterElem) => filterElem.user_some);
    const loSome = filterArray.find((filterElem) => filterElem.learningObjective_some);
    const topicSome = filterArray.find((filterElem) => filterElem.topic_some);
    const courseSome = filterArray.find((filterElem) => filterElem.course_some);
    const videoSome = filterArray.find((filterElem) => filterElem.video_some);
    userId = get(userSome, 'user_some.id');
    topicId = get(topicSome, 'topic_some.id');
    learningObjectiveId = get(loSome, 'learningObjective_some.id');
    courseId = get(courseSome, 'course_some.id');
    videoId = get(videoSome, 'video_some.id');
    if (!userId) {
      log('userId is missing in input of postHook');
    }
    if (page === 'learningObjective' && !learningObjectiveId) {
      log('LearningObjectiveId is missing in input of postHook');
    } else if ((page === 'video' || page === 'quiz') && !topicId) {
      log('TopicId is missing in input of postHook');
    }
  }
  return {
    userId,
    learningObjectiveId,
    topicId,
    courseId,
    videoId,
  };
};

export default getInfoFromParams;

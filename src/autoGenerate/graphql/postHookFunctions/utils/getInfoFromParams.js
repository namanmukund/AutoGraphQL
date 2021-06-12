import { get } from 'lodash';
import { log } from '../../../../../utils';

const getInfoFromParams = (params, page) => {
  let userId;
  let topicId;
  let learningObjectiveId;
  let courseId;
  let videoId;
  let blockBasedPracticeId;
  let blockBasedProjectId;
  const filterArray = get(params, 'filter.and');
  if (filterArray) {
    const userSome = filterArray.find((filterElem) => filterElem.user_some);
    const loSome = filterArray.find((filterElem) => filterElem.learningObjective_some);
    const topicSome = filterArray.find((filterElem) => filterElem.topic_some);
    const courseSome = filterArray.find((filterElem) => filterElem.course_some);
    const videoSome = filterArray.find((filterElem) => filterElem.video_some);
    const blockBasedPracticeSome = filterArray.find((filterElem) => filterElem.blockBasedPractice_some);
    const blockBasedProjectSome = filterArray.find((filterElem) => filterElem.blockBasedProject_some);
    userId = get(userSome, 'user_some.id');
    topicId = get(topicSome, 'topic_some.id');
    learningObjectiveId = get(loSome, 'learningObjective_some.id');
    courseId = get(courseSome, 'course_some.id');
    videoId = get(videoSome, 'video_some.id');
    blockBasedPracticeId = get(blockBasedPracticeSome, 'blockBasedPractice_some.id');
    blockBasedProjectId = get(blockBasedProjectSome, 'blockBasedProject_some.id');
    if (!userId) {
      log('userId is missing in input of postHook');
    }
    if (page === 'learningObjective' && !learningObjectiveId) {
      log('LearningObjectiveId is missing in input of postHook');
    } else if ((page === 'video' || page === 'quiz' || page === 'blockBasedProject') && !topicId) {
      log('TopicId is missing in input of postHook');
    } else if (page === 'blockBasedProject' && !blockBasedProjectId) {
      log('BlockBasedProjectId is missing in input of postHook');
    } else if (page === 'blockBasedPractice' && !blockBasedPracticeId) {
      log('blockBasedPracticeId is missing in input of postHook');
    }
  }
  return {
    userId,
    learningObjectiveId,
    topicId,
    courseId,
    videoId,
    blockBasedPracticeId,
    blockBasedProjectId,
  };
};

export default getInfoFromParams;

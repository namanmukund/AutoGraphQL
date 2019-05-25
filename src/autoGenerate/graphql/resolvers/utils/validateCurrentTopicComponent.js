import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';

const validateCurrentTopicComponent = (currentTopicComponentInfo, mutationName) => {
  /*
  This case should not occur as we have added logic in prehook userTopicJourneyMethod
  to add userCurrentTopicComponentStatus if it not already present and
  the first published topic and first published learning objective corresponding to that topic
  will get populated in the document
  */
  if (!currentTopicComponentInfo) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'UserCurrentTopicComponentStatus: is not present',
      },
    });
  }
  const {
    currentCourse,
    currentTopicComponentType: currentTopicComponent,
    currentTopic,
    currentLearningObjective,
    enrollmentType,
  } = currentTopicComponentInfo;
  // throwing errors if some data is missing in User current topic component status
  if (mutationName === 'userCourseSyllabus' && !currentCourse) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'CurrentCourse: is not present',
      },
    });
  }

  if (!currentTopicComponent) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'CurrentTopicComponent: is not present',
      },
    });
  }
  if (!currentTopic) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'CurrentTopic: is not present',
      },
    });
  }
  if (!currentLearningObjective) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'CurrentLearningObjective: is not present',
      },
    });
  }
  if (!enrollmentType) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'EnrollmentType: is not present',
      },
    });
  }
  return true;
};

export default validateCurrentTopicComponent;

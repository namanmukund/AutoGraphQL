import { get } from 'lodash';
import {
  GLOBAL_COURSE_TITLE, OLD_COURSE_ID, PUBLISHED, topicTypes,
} from '../../../../constants';
import {
  DatabaseRecordNotFoundError,
} from '../../../../constants/errors';
import getFirstTopicAndLearningObjective from '../../utils/getFirstTopicAndLearningObjective';
import addUserCurrentTopicComponentStatus from '../../utils/addUserCurrentTopicComponentStatus';
import getUserIdandAppNameAfterValidation
  from './validation/utils/getUserIdandAppNameAfterValidation';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import getFirstTopicComponents from '../../utils/getFirstTopicComponents';
import addUserCurrentTopicComponentStatusForNewCourse from '../../utils/addUserCurrentTopicComponentStatusForNewCourse';

const {
  message, practiceQuestion, comicStrip, quiz,
} = topicTypes;

// query to get current component status of user
const userCurrentTopicComponentStatusesQuery = (userId, courseId) => `
  query{
    userCurrentTopicComponentStatuses(filter:{
      and:[
        {user_some:{
        id:"${userId}"
        }},
        {currentCourse_some:{
          ${courseId ? `id: "${courseId}"` : `and:[ {status: ${PUBLISHED}}, {title: "${GLOBAL_COURSE_TITLE}"}]`}
        }}
      ]
    }){
      id
    }
  }
  `;

/*
Logic to add userCurrentTopicComponentStatus if it not already present and
the first published topic and first published learning objective corresponding to that topic
will get populated in the document
*/
const userCourseSyllabusMethod = async (context, params) => {
  /*
  Calling method to validate token and return userId.
  we will compare this userId against userId passed in input
  both should be equal to perform further action
  */
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context, true);
  const {
    userIdFromContext: userId,
  } = userAndAppInfo;

  const { courseId } = params;
  /*
  If user is not logged in and asking for course syllabus then we will not add
  any document in Db and will return default data with first topic as unlocked
  */
  if (userId) {
    const userCurrentTopicComponentStatusesRes = await callLocalGraphqlApi(userCurrentTopicComponentStatusesQuery(userId, courseId));

    /*
    Ideally each user will have 1 document in the collection. Fetching the same document
    Also we have logic in addUserCurrentTopicComponentStatusValidation to check that
    user and course combination being added is not already present
    */
    const currentTopicComponentInfo = get(userCurrentTopicComponentStatusesRes,
      'data.userCurrentTopicComponentStatuses[0]');
    if (!currentTopicComponentInfo) {
      if (!courseId || (courseId === OLD_COURSE_ID)) {
        const topic = await getFirstTopicAndLearningObjective();
        const firstTopicId = get(topic, 'data.topics[0].id');
        const firstLearningObjectiveId = get(topic, 'data.topics[0].learningObjectives[0].id');
        // returning error if there is no published topic or no published LO for topic
        if (!firstTopicId) {
          throw new DatabaseRecordNotFoundError({
            data: {
              error: 'FirstTopicId is not present',
            },
          });
        }
        if (!firstLearningObjectiveId) {
          throw new DatabaseRecordNotFoundError({
            data: {
              error: 'FirstTopicId.firstLearningObjectiveId: is not present',
            },
          });
        }
        // mutation to create current component status of user with current topic as first topic
        // and current LO as first LO of topic and video as current component type
        await addUserCurrentTopicComponentStatus(
          userId, firstTopicId, firstLearningObjectiveId,
        );
      } else {
        const {
          video, blockBasedPractice, blockBasedProject,
        } = topicTypes;
        const topic = await getFirstTopicComponents(courseId);
        const firstTopicId = get(topic, 'data.topics[0].id');
        const topicComponentRule = get(topic, 'data.topics[0].topicComponentRule');
        // returning error if there is no published topic
        if (!firstTopicId) {
          throw new DatabaseRecordNotFoundError({
            data: {
              error: 'FirstTopicId is not present',
            },
          });
        }
        // returning error if there is no component in the published topic
        let isVideoPresent = false;
        let firstVideoId = '';
        let isLearningObjectivePresent = false;
        let firstLearningObjectiveId = '';
        let isBlockedBasedProjectPresent = false;
        let firstBlockedBasedProjectId = '';
        let firstComponentName = 'video';
        if (topicComponentRule && topicComponentRule.length) {
          // throw new DatabaseRecordNotFoundError({
          //   data: {
          //     error: 'Component rule is not present in topic',
          //   },
          // });
          const sortedTopicComponentRule = topicComponentRule.sort((firstItem, secondItem) => firstItem.order - secondItem.order);
          firstComponentName = sortedTopicComponentRule[0].componentName;

          sortedTopicComponentRule.forEach((topicComponent) => {
            if (topicComponent.componentName === video && !firstVideoId) {
              isVideoPresent = true;
              firstVideoId = topicComponent.video && topicComponent.video.id;
            } else if (topicComponent.componentName === 'learningObjective' && !firstLearningObjectiveId) {
              isLearningObjectivePresent = true;
              firstLearningObjectiveId = topicComponent.learningObjective && topicComponent.learningObjective.id;
            } else if (topicComponent.componentName === blockBasedPractice && !firstBlockedBasedProjectId) {
              isBlockedBasedProjectPresent = true;
              firstBlockedBasedProjectId = topicComponent.blockBasedProject && topicComponent.blockBasedProject.id;
            } else if (topicComponent.componentName === blockBasedProject && !firstBlockedBasedProjectId) {
              isBlockedBasedProjectPresent = true;
              firstBlockedBasedProjectId = topicComponent.blockBasedProject && topicComponent.blockBasedProject.id;
            }
          });

          if (firstComponentName === 'learningObjective') {
            const messageCount = get(sortedTopicComponentRule[0], 'learningObjective.messagesMeta.count', 0);
            const pqCount = get(sortedTopicComponentRule[0], 'learningObjective.questionBankMeta.count', 0);
            const comicStripCount = get(sortedTopicComponentRule[0], 'learningObjective.comicStripsMeta.count', 0);
            if (messageCount) {
              firstComponentName = message;
            } else if (pqCount) {
              firstComponentName = practiceQuestion;
            } else if (comicStripCount) {
              firstComponentName = comicStrip;
            }
          } else if (['assignment', 'homeworkAssignment', 'homeworkPractice'].includes(firstComponentName)) {
            currentTopicComponentType = quiz;
          }

          // returning error if there is no published video
          if (isVideoPresent && !firstVideoId) {
            throw new DatabaseRecordNotFoundError({
              data: {
                error: 'firstVideoId is not present',
              },
            });
          }

          // returning error if there is no published firstLearningObjective
          if (isLearningObjectivePresent && !firstLearningObjectiveId) {
            throw new DatabaseRecordNotFoundError({
              data: {
                error: 'firstLearningObjectiveId is not present',
              },
            });
          }

          // returning error if there is no published firstBlockedBasedProjectId
          if (isBlockedBasedProjectPresent && !firstBlockedBasedProjectId) {
            throw new DatabaseRecordNotFoundError({
              data: {
                error: 'firstBlockedBasedProjectId is not present',
              },
            });
          }
        }

        // mutation to create current component status of user with current topic as first topic and courseId
        // and current LO as first LO of topic and video as current component type
        await addUserCurrentTopicComponentStatusForNewCourse(
          userId, courseId, firstTopicId, firstLearningObjectiveId, firstVideoId, firstBlockedBasedProjectId, firstComponentName,
        );
      }
    }
  }
};

export default userCourseSyllabusMethod;

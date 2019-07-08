import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  GLOBAL_COURSE_TITLE,
} from '../../../../constants';
import {
  DatabaseRecordNotFoundError,
} from '../../../../constants/errors';
import getFirstTopicAndLearningObjective from '../../utils/getFirstTopicAndLearningObjective';
import addUserCurrentTopicComponentStatus from '../../utils/addUserCurrentTopicComponentStatus';
import getUserIdandAppNameAfterValidation
  from './validation/utils/getUserIdandAppNameAfterValidation';

// query to get current component status of user
const userCurrentTopicComponentStatusesQuery = userId => `
  query{
    userCurrentTopicComponentStatuses(filter:{
      and:[
        {user_some:{
        id:"${userId}"
        }},
      {currentCourse_some:{
        and:[
          {status: published},
          {title: ${GLOBAL_COURSE_TITLE}}
        ]
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
const userCourseSyllabusMethod = async (context) => {
  /*
  Calling method to validate token and return userId.
  we will compare this userId against userId passed in input
  both should be equal to perform further action
  */
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context, true);
  const {
    userIdFromContext: userId,
  } = userAndAppInfo;
  /*
  If user is not logged in and asking for course syllabus then we will not add
  any document in Db and will return default data with first topic as unlocked
  */
  if (userId) {
    const userCurrentTopicComponentStatusesRes =
      await callGraphqlApi(userCurrentTopicComponentStatusesQuery(userId));
    /*
    Ideally each user will have 1 document in the collection. Fetching the same document
    Also we have logic in addUserCurrentTopicComponentStatusValidation to check that
    user and course combination being added is not already present
    */
    const currentTopicComponentInfo = get(userCurrentTopicComponentStatusesRes,
      'data.userCurrentTopicComponentStatuses[0]');
    if (!currentTopicComponentInfo) {
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
        userId, firstTopicId, firstLearningObjectiveId);
    }
  }
};

export default userCourseSyllabusMethod;

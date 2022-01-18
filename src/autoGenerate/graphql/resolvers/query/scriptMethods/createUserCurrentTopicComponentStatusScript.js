import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import addUserCurrentTopicComponentStatusOperation from '../../../../utils/addUserCurrentTopicComponentStatusOperation';

const getSalesOperations = async () => {
  const query = `{
  salesOperations(
    filter: {
      and: [
        { leadStatus: won },
        { course_exists: true }
      ]
    }
  ) {
    id
    client {
      id
    }
    course {
      id
    }
  }
}`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.salesOperations', []);
};

const getUserCurrentTopicComponentStatus = async (userId, courseId) => {
  const query = `{
    userCurrentTopicComponentStatuses(filter:{
      and:[
        {user_some:{
        id:"${userId}"
        }},
      {currentCourse_some:{
          id:"${courseId}"
      }}
      ]
    }){
      id
    }
  }`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.userCurrentTopicComponentStatuses', []);
};

const createUserCurrentTopicComponentStatusScript = async () => {
  const salesOperationData = await getSalesOperations();
  if (salesOperationData && salesOperationData.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const salesOperation of salesOperationData) {
      const userId = get(salesOperation, 'client.id');
      const courseId = get(salesOperation, 'course.id');
      if (userId && courseId) {
        // eslint-disable-next-line no-await-in-loop
        const userCurrentTopicComponentStatus = await getUserCurrentTopicComponentStatus(userId, courseId);
        if (userCurrentTopicComponentStatus.length === 0) {
          // eslint-disable-next-line no-await-in-loop
          await addUserCurrentTopicComponentStatusOperation(courseId, userId);
          // eslint-disable-next-line no-console
          console.log(`created UserCurrentTopicComponentStatus for user ${userId}`);
        }
      }
    }
  }
};

export default createUserCurrentTopicComponentStatusScript;

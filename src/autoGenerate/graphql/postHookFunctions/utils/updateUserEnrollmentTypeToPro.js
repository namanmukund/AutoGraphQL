import { get } from 'lodash';
import {
  GLOBAL_COURSE_TITLE,
  PUBLISHED,
  enrollmentTypes,
} from '../../../../../constants';
import {
  DatabaseRecordNotFoundError,
} from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

// query to get current component status of user
const getUserCurrentTopicComponentStatus = (userId) => `
  query{
    userCurrentTopicComponentStatuses(filter:{
      and:[
        {user_some:{
        id:"${userId}"
        }},
      {currentCourse_some:{
        and:[
          {status: ${PUBLISHED}},
          {title: "${GLOBAL_COURSE_TITLE}"}
        ]
      }}
      ]
    }){
      id
      enrollmentType
    }
  }
  `;

// mutation to update UserPayment
const updateUserCurrentTopicComponentStatus = (
  id,
) => `
  mutation{
    updateUserCurrentTopicComponentStatus(
    id: "${id}",
    input:{
      enrollmentType: ${enrollmentTypes.pro}
    }
    ){
      id
    }
  }
  `;

// menthod starts from here
const updateUserEnrollmentTypeToPro = async (userId) => {
  // get UserCurrentTopicComponentStatus to get its id and enrollment type
  const userCurrentTopicComponentStatusRes = await callLocalGraphqlApi(getUserCurrentTopicComponentStatus(userId));

  const currentTopicComponentInfoId = get(userCurrentTopicComponentStatusRes, 'data.userCurrentTopicComponentStatuses[0].id');
  const userEnrollmentType = get(userCurrentTopicComponentStatusRes, 'data.userCurrentTopicComponentStatuses[0].enrollmentType');
  if (!currentTopicComponentInfoId) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: `UserCurrentTopicComponentStatus: is not present for userId: ${userId}`,
      },
    });
  }

  // update UserCurrentTopicComponentStatus, change user to pro if it is free
  if (userEnrollmentType === enrollmentTypes.free) {
    await callLocalGraphqlApi(updateUserCurrentTopicComponentStatus(
      currentTopicComponentInfoId,
    ));
  }

  return true;
};

export default updateUserEnrollmentTypeToPro;

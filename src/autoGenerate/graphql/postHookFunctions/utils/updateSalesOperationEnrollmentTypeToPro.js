import { get } from 'lodash';
import {
  enrollmentTypes,
} from '../../../../../constants';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

// query to get user sales operation
const getUserSalesOperation = (userId) => `
  query{
    salesOperations(filter:{
      client_some:{
        id:"${userId}"
      }
    }){
      id
      enrollmentType
    }
  }
  `;

// mutation to update UserPayment
const updateUserSalesOperation = (
  id,
) => `
  mutation{
    updateSalesOperation(
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
const updateSalesOperationEnrollmentTypeToPro = async (userId) => {
  // get user sales operation to get its id and enrollment type
  const userSalesOperationRes = await callLocalGraphqlApi(getUserSalesOperation(userId));

  const userSalesOperationId = get(userSalesOperationRes, 'data.salesOperations[0].id');
  const userSalesOperationEnrollmentType = get(userSalesOperationRes, 'data.salesOperations[0].enrollmentType');
  if (!userSalesOperationId) {
    log('User sales operation is not present in post hook of add/update UserCurrentTopicComponentStatusPostHookMethod');
  }
  // update user sales operation, change user to pro if it is free
  if (userSalesOperationId && userSalesOperationEnrollmentType === enrollmentTypes.free) {
    await callLocalGraphqlApi(updateUserSalesOperation(
      userSalesOperationId,
    ));
  }

  return true;
};

export default updateSalesOperationEnrollmentTypeToPro;

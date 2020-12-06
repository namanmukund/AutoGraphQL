import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const userCurrentTopicComponentStatusesQuery = () => `
query{
  userCurrentTopicComponentStatuses(
    first: 1000,
    skip: 0,
     orderBy: createdAt_DESC
  ){
    id
    user{
      id
      source
    }
    enrollmentType
  }
}
`;

const userSalesOperationResQuery = (
  userId,
) => `
query{
  salesOperations(filter:{
    client_some:{
      id: "${userId}"
    }
  }){
    id
  }
}
`;

const updateUserSalesOperation = (
  id,
  enrollmentType,
) => `
 mutation{
  updateSalesOperation(
  id: "${id}",
  input:{
    enrollmentType: ${enrollmentType}
  }
  ){
    id
  }
}
`;

const addSalesOperationQuery = (
  userId,
  source,
  enrollmentType,
) => `
mutation{
  addSalesOperation(
  clientConnectId: "${userId}"
  input:{
    enrollmentType: ${enrollmentType}
    source: ${source}
  }){
    id
  }
}
`;

const addProEnrollmentTypeInSalesOperation = async () => {
  const userCurrentTopicComponentStatusesQueryRes = await callLocalGraphqlApi(userCurrentTopicComponentStatusesQuery());
  const userCurrentTopicComponentStatusesArray = get(userCurrentTopicComponentStatusesQueryRes, 'data.userCurrentTopicComponentStatuses', []);
  let count = 0;
  let salesOperationCount = 0;
  // eslint-disable-next-line no-restricted-syntax
  for (const userCurrentTopicComponentStatus of userCurrentTopicComponentStatusesArray) {
    if (userCurrentTopicComponentStatus.user && userCurrentTopicComponentStatus.user.id) {
      count += 1;
      // eslint-disable-next-line no-console
      console.log('----------------------------user-----------------------------', count);
      // eslint-disable-next-line no-console
      console.log('----------------------------userId', userCurrentTopicComponentStatus.user.id);
      try {
        // eslint-disable-next-line no-await-in-loop
        const userSalesOperationRes = await callLocalGraphqlApi(userSalesOperationResQuery(userCurrentTopicComponentStatus.user.id));
        const salesOperationId = get(userSalesOperationRes, 'data.salesOperations[0].id', '');
        // eslint-disable-next-line no-console
        console.log('----------------------------salesOperationId', salesOperationId);
        if (salesOperationId) {
          salesOperationCount += 1;
          try {
            // eslint-disable-next-line no-await-in-loop
            await callLocalGraphqlApi(updateUserSalesOperation(
              salesOperationId,
              userCurrentTopicComponentStatus.enrollmentType,
            ));
          } catch (e) {
            // eslint-disable-next-line no-console
            console.log('----------------------updateUserSalesOperation error', e);
          }
        } else {
          try {
            // eslint-disable-next-line no-await-in-loop
            const addSalesOperationQueryRes = await callLocalGraphqlApi(addSalesOperationQuery(
              userCurrentTopicComponentStatus.user.id,
              userCurrentTopicComponentStatus.user.source,
              userCurrentTopicComponentStatus.enrollmentType,
            ));
            // eslint-disable-next-line no-console
            console.log('------------------------------added salesOperationId', get(addSalesOperationQueryRes, 'data.addSalesOperation.id', ''));
          } catch (e) {
            // eslint-disable-next-line no-console
            console.log('----------------------addSalesOperationQuery error', e);
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('----------------------userSalesOperationResQuery error', e);
      }
    }
  }
  // eslint-disable-next-line no-console
  console.log('------------------------------salesOperationCount', salesOperationCount);
  // eslint-disable-next-line no-console
  console.log('------------------------------count', count);
};

export default addProEnrollmentTypeInSalesOperation;

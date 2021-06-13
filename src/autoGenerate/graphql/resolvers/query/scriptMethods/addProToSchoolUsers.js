import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

// Mayoor School
// DPS Ujjain
// Swiss Cottage School
// NPS Gottigere
const userCurrentTopicComponentStatusesQuery = () => `
query{
  userCurrentTopicComponentStatuses(
    filter:{
      user_some:{
        studentProfile_some:{
          school_some:{
            name: "NPS Gottigere"
          }
        }
      }
    }
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

const updateUserCurrentComponentStatusQuery = (
  userCurrentComponentStatusId,
) => `
  mutation{
    updateUserCurrentTopicComponentStatus(id:"${userCurrentComponentStatusId}",
    input:{
      enrollmentType:pro
    }
    ){
      id
    }
  }
`;

const addProToSchoolUsers = async () => {
  const userCurrentTopicComponentStatusesQueryRes = await callLocalGraphqlApi(userCurrentTopicComponentStatusesQuery());
  const userCurrentTopicComponentStatusesArray = get(userCurrentTopicComponentStatusesQueryRes, 'data.userCurrentTopicComponentStatuses', []);
  let count = 0;
  // eslint-disable-next-line no-restricted-syntax
  for (const userCurrentTopicComponentStatus of userCurrentTopicComponentStatusesArray) {
    if (userCurrentTopicComponentStatus.id && userCurrentTopicComponentStatus.user && userCurrentTopicComponentStatus.user.id) {
      count += 1;
      // eslint-disable-next-line no-console
      console.log('----------------------------user-----------------------------', count);
      // eslint-disable-next-line no-console
      console.log('----------------------------userId', userCurrentTopicComponentStatus.user.id);
      try {
        // eslint-disable-next-line no-await-in-loop
        const updateUserCurrentComponentStatusQueryRes = await callLocalGraphqlApi(updateUserCurrentComponentStatusQuery(
          userCurrentTopicComponentStatus.id,
        ));
        // eslint-disable-next-line no-console
        console.log('------------------------------updated userCurrentTopicComponentStatusId', get(updateUserCurrentComponentStatusQueryRes, 'data.updateUserCurrentTopicComponentStatus.id', ''));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('----------------------updateUserCurrentComponent error', e);
      }
    }
  }
  // eslint-disable-next-line no-console
  console.log('------------------------------count', count);
};

export default addProToSchoolUsers;

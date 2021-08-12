import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import generateInviteCode from '../../../../../../utils/generateInviteCode';

const fetchSchools = async () => {
  const query = `
          {
            schools{
              id
            }
          }
          `;
  const schools = await callLocalGraphqlApi(query);
  return get(schools, 'data.schools', []);
};

const updateCampignCodeInSchool = async (schoolId, code) => {
  const mutation = `
      mutation{
        updateSchool(id: "${schoolId}",
         input : {
          schoolCampaignCode: "${code}"
         }
         ){
          id
        }
      }
      `;
  const result = await callLocalGraphqlApi(mutation);
  return get(result, 'data.updateSchool', {});
};

const updateSchoolCampaignCodeInSchool = async () => {
  // eslint-disable-next-line no-await-in-loop
  const schools = await fetchSchools();
  // eslint-disable-next-line no-restricted-syntax
  for (const school of schools) {
    const schoolId = school.id;
    const code = generateInviteCode(8);
    if (schoolId && code) {
      // eslint-disable-next-line no-await-in-loop
      await updateCampignCodeInSchool(schoolId, code);
      // eslint-disable-next-line no-console
      console.log(`>>>>> Updated schoolId id : ${schoolId}`);
    }
  }
  // eslint-disable-next-line no-console
  console.log('-------------------------------------done--------------------------------');
};
export default updateSchoolCampaignCodeInSchool;

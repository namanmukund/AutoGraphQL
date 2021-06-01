import { get } from 'lodash';
import { StudentsLinked } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchSchools = async (schoolId) => {
  const query = `
          {
            schools(filter: {id: "${schoolId}"}){
              id
              studentsMeta{
                count
              }
            }
          }
          `;
  const school = await callLocalGraphqlApi(query);
  return get(school, 'data.schools', []);
};

const deleteSchoolValidation = async (params) => {
  const { id: schoolId } = params;

  // checking if students are linked to the school corresponding to the id
  const schools = await fetchSchools(schoolId);
  if (schools && schools.length > 0) {
    const studentsMeta = schools[0].studentsMeta;
    if (studentsMeta && studentsMeta.count !== 0) {
      throw new StudentsLinked();
    }
  }
  return true;
};

export default deleteSchoolValidation;

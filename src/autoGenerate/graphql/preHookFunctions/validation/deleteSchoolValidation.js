import { get } from 'lodash';
import { StudentsLinked } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchSchools = async (schoolId) => {
  const query = `
          {
            schools(filter:
              {
                and:[
                  {id: "${schoolId}"},
                  {students_exists:true}
                ]
              }
            ){
              id
            }
          }
          `;
  const school = await callLocalGraphqlApi(query);
  return get(school, 'data.schools', []);
};

const deleteSchoolValidation = async (params) => {
  const { id: schoolId } = params;
  const schools = await fetchSchools(schoolId);
  if (schools && schools.length > 0) {
    throw new StudentsLinked();
  }
  return true;
};

export default deleteSchoolValidation;

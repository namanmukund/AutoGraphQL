import { get } from 'lodash';
import { StudentsLinked } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchSchoolClasses = async (schoolClassId) => {
  const query = `
          {
            schoolClasses(filter: {id: "${schoolClassId}"}){
              id
              studentsMeta{
                count
              }
            }
          }
          `;
  const schoolClass = await callLocalGraphqlApi(query);
  return get(schoolClass, 'data.schoolClasses', []);
};

const deleteSchoolClassValidation = async (params) => {
  const { id: schoolClassId } = params;

  // checking if students are linked to the schoolClass corresponding to the id
  const schoolClasses = await fetchSchoolClasses(schoolClassId);
  if (schoolClasses && schoolClasses.length > 0) {
    const studentsMeta = schoolClasses[0].studentsMeta;
    if (studentsMeta && studentsMeta.count !== 0) {
      throw new StudentsLinked();
    }
  }
  return true;
};

export default deleteSchoolClassValidation;

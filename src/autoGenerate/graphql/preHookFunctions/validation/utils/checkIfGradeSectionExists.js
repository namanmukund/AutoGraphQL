import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const fetchSchoolClasses = async (schoolId, grade, section) => {
  const query = `
          {
            schoolClasses(filter:
              {
                and:[
                  {school_some: {id: "${schoolId}"}},
                  {grade: ${grade}},
                  {section: ${section}}
                ]
              }
            ){
              id
              grade
              section
            }
          }
          `;
  const schoolClass = await callLocalGraphqlApi(query);
  return get(schoolClass, 'data.schoolClasses', []);
};

export default fetchSchoolClasses;

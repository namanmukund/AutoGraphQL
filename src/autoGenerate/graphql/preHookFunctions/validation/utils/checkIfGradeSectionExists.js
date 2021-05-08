import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const fetchSchools = async (schoolId, grade, section) => {
  const query = `
          {
            schools(filter: {
              and:[
                {id: "${schoolId}"},
                {classes_grade_subDoc: "${grade}"},
                {classes_section_subDoc: "${section}"},
              ]
            }){
              id
              name
              classes{
                grade
                section
                subjects
              }
            }
          }
          `;
  const school = await callLocalGraphqlApi(query);
  return get(school, 'data.schools', []);
};

export default fetchSchools;

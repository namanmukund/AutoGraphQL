import { GradeSectionCombinationAlreadyExists } from '../../../../../constants/errors';
import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchSchoolClass = async (schoolClassId, grade, section) => {
  const query = `
          {
            schoolClasses(filter:
              {
                and:[
                  {id: "${schoolClassId}"},
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

const updateSchoolClassGradeSectionValidation = async (params) => {
  const { id: schoolClassId, input: { grade, section } } = params;
  const schoolClasses = await fetchSchoolClass(schoolClassId, grade, section);
  if (schoolClasses && schoolClasses.length > 0) {
    throw new GradeSectionCombinationAlreadyExists();
  }
  return true;
};

export default updateSchoolClassGradeSectionValidation;

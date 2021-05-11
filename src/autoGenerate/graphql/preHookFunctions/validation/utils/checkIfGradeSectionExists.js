import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const getGradeFilter = (grade) => {
  if (grade) {
    return `{grade : ${grade}}`;
  }
  return '';
};

const getSectionFilter = (section) => {
  if (section) {
    return `{section : ${section}}`;
  }
  return '';
};

const getSchoolFilter = (schoolConnectId) => {
  if (schoolConnectId) {
    return `{school_some: {id : "${schoolConnectId}"}}`;
  }
  return '';
};

const getSchoolClassIdFilter = (schoolClassId) => {
  if (schoolClassId) {
    return `{ id: "${schoolClassId}" }`;
  }
  return '';
};

const fetchSchoolClasses = async (schoolClassId, grade, section, schoolConnectId) => {
  const query = `
          {
            schoolClasses(filter:
              {
                and:[
                  ${getSchoolClassIdFilter(schoolClassId)}
                  ${getGradeFilter(grade)}
                  ${getSectionFilter(section)}
                  ${getSchoolFilter(schoolConnectId)}
                ]
              }
            ){
              id
              grade
              section
              school{
                id
              }
            }
          }
          `;
  const schoolClass = await callLocalGraphqlApi(query);
  return get(schoolClass, 'data.schoolClasses', []);
};

export default fetchSchoolClasses;

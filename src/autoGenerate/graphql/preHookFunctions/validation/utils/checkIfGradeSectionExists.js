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

const getAcademicYearFilter = (academicYearsConnectIds) => {
  if (academicYearsConnectIds && academicYearsConnectIds.length) {
    return `{ academicYears_some: { id: "${academicYearsConnectIds[0]}" }}`;
  }
  return '';
};

const fetchSchoolClasses = async (schoolClassId, grade, section, schoolConnectId, academicYearsConnectIds) => {
  const query = `
          {
            schoolClasses(filter:
              {
                and:[
                  ${getSchoolClassIdFilter(schoolClassId)}
                  ${getGradeFilter(grade)}
                  ${getSectionFilter(section)}
                  ${getSchoolFilter(schoolConnectId)}
                  ${getAcademicYearFilter(academicYearsConnectIds)}
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

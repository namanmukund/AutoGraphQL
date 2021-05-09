import { GradeSectionCombinationAlreadyExists } from '../../../../../constants/errors';
import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const getGradeFilter = (grade) => {
  if (grade) {
    return `{grade : ${grade}}`
  }
  return ''
}

const getSectionFilter = (section) => {
  if (section) {
    return `{section : ${section}}`
  }
  return ''
}

const getSchoolFilter = (schoolConnectId) => {
  if (schoolConnectId) {
    return `{school_some: {id : "${schoolConnectId}"}}`
  }
  return ''
}

const getSchoolClassIdFilter = (schoolClassId) => {
  if (schoolClassId) {
    return `{ id: "${schoolClassId}" }`
  }
  return ''
}

const fetchSchoolClass = async (schoolClassId, grade, section, schoolConnectId) => {
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

const updateSchoolClassValidation = async (params) => {
  const { id: schoolClassId, input: { grade, section, schoolConnectId } } = params;

  // if update query is to change the school linked to the class, we have to pass the schoolId, and fetch the grade and sections of all classes corresponding to that schoolId
  if (schoolConnectId) {
    const schoolClassesOfGivenSchoolId = await fetchSchoolClass(null, null, null, schoolConnectId);
    if (schoolClassesOfGivenSchoolId && schoolClassesOfGivenSchoolId.length > 0) {

      // then we fetch the already stored grade and section from the given schoolClassId
      const schoolClassOfGivenId = await fetchSchoolClass(schoolClassId);
      if (schoolClassOfGivenId && schoolClassOfGivenId.length > 0) {
        const gradeOfClass = schoolClassOfGivenId[0].grade;
        const sectionOfClass = schoolClassOfGivenId[0].section;

        // then we iterate through the results of existing school classes in the first result and if any of the grade and section from that list matches the grade and section of the current schoolClass, we will throw error
        schoolClassesOfGivenSchoolId.map(item => {
          if (item.grade === gradeOfClass && item.section === sectionOfClass) {
            throw new GradeSectionCombinationAlreadyExists();
          }
        })
      }
    }
  } else {

    // else if the update query is to change the grade or section of school class without changin the school it is connected to, we first query the school id corresponding to the schoolClassId
    const schoolClassOfGivenId = await fetchSchoolClass(schoolClassId);
    if (schoolClassOfGivenId && schoolClassOfGivenId.length > 0) {
      const schoolId = schoolClassOfGivenId[0].school.id;

      // then we check if for the given input of grade and class if there exists some document in the same school, by passing the school id
      const schoolClasses = await fetchSchoolClass(null, grade, section, schoolId);
      if (schoolClasses && schoolClasses.length > 0) {
        throw new GradeSectionCombinationAlreadyExists();
      }
    }
  }
  return true;
};

export default updateSchoolClassValidation;

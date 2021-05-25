import { GradeSectionCombinationAlreadyExists } from '../../../../../constants/errors';
import fetchSchoolClasses from './utils/checkIfGradeSectionExists';

const updateSchoolClassValidation = async (params) => {
  const { id: schoolClassId, input: { grade, section, schoolConnectId } } = params;

  // if update query is to change the school linked to the class, we have to pass the schoolId, and fetch the grade and sections of all classes corresponding to that schoolId
  if (schoolConnectId) {
    const schoolClassesOfGivenSchoolId = await fetchSchoolClasses(null, null, null, schoolConnectId);
    if (schoolClassesOfGivenSchoolId && schoolClassesOfGivenSchoolId.length > 0) {
      // then we fetch the already stored grade and section from the given schoolClassId
      const schoolClassOfGivenId = await fetchSchoolClasses(schoolClassId);
      if (schoolClassOfGivenId && schoolClassOfGivenId.length > 0) {
        const gradeOfClass = schoolClassOfGivenId[0].grade;
        const sectionOfClass = schoolClassOfGivenId[0].section;

        // then we iterate through the results of existing school classes in the first result and if any of the grade and section from that list matches the grade and section of the current schoolClass, we will throw error
        // eslint-disable-next-line array-callback-return
        schoolClassesOfGivenSchoolId.map((item) => {
          if (item.grade === gradeOfClass && item.section === sectionOfClass) {
            throw new GradeSectionCombinationAlreadyExists();
          }
        });
      }
    }
  } else {
    // else if the update query is to change the grade or section of school class without changin the school it is connected to, we first query the school id corresponding to the schoolClassId
    const schoolClassOfGivenId = await fetchSchoolClasses(schoolClassId);
    if (schoolClassOfGivenId && schoolClassOfGivenId.length > 0) {
      const schoolId = schoolClassOfGivenId[0].school.id;
      const gradeFetched = schoolClassOfGivenId[0].grade;
      const sectionFetched = schoolClassOfGivenId[0].section;

      // then we check if for the given input of grade and class if there exists some document in the same school, by passing the school id

      if (grade && section) {
        const schoolClasses = await fetchSchoolClasses(null, grade, section, schoolId);
        if (schoolClasses && schoolClasses.length > 0) {
          throw new GradeSectionCombinationAlreadyExists();
        }
      } else if (grade && !section) {
        if (sectionFetched) {
          const schoolClasses = await fetchSchoolClasses(null, grade, sectionFetched, schoolId);
          if (schoolClasses && schoolClasses.length > 0) {
            throw new GradeSectionCombinationAlreadyExists();
          }
        }
      } else if (!grade && section) {
        // grade mandatory but added for uniformity
        if (gradeFetched) {
          const schoolClasses = await fetchSchoolClasses(null, gradeFetched, section, schoolId);
          if (schoolClasses && schoolClasses.length > 0) {
            throw new GradeSectionCombinationAlreadyExists();
          }
        }
      }
    }
  }
  return true;
};

export default updateSchoolClassValidation;

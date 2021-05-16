import { get } from 'lodash';
import addUpdateSchoolClass from './utils/addUpdateSchoolClass';

const addStudentProfilePostHookMethod = async (input, params) => {
  const currentSection = get(params, 'input.section');
  const currentGrade = input.grade;
  const schoolId = get(input, 'school.typeId');
  if (schoolId && currentGrade && currentSection) {
    const schoolClassId = await addUpdateSchoolClass(
      {
        grade: currentGrade,
        section: currentSection,
      },
      schoolId,
      input.id,
    );
    Object.assign(input, { schoolClass: { type: 'SchoolClass', typeId: schoolClassId } });
  }
};

export default addStudentProfilePostHookMethod;

import { get } from 'lodash';
import addUpdateSchoolClass from './utils/addUpdateSchoolClass';
import addSchoolSessionOtpInBatchSession from './utils/addSchoolSessionOtpInBatchSession';

const addStudentProfilePostHookMethod = async (input, params) => {
  const currentSection = get(params, 'input.section');
  const currentGrade = input.grade;
  const schoolId = get(input, 'school.typeId');
  const batchId = get(input, 'batch.typeId');
  const studentProfileId = get(input, 'id');
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
    if (batchId && currentGrade && currentSection) {
      addSchoolSessionOtpInBatchSession(batchId, studentProfileId, currentGrade, currentSection);
    }
  }
};

export default addStudentProfilePostHookMethod;

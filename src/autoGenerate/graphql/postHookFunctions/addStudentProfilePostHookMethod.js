import { get } from 'lodash';
import addUpdateSchoolClass from './utils/addUpdateSchoolClass';
import addSchoolSessionOtpInBatchSession from './utils/addSchoolSessionOtpInBatchSession';
import { updateStudentProfile, userBatchQuery } from './utils/updateStudentBatchUtils';

const addStudentProfilePostHookMethod = async (input, params, mutationName, context) => {
  const currentSection = get(params, 'input.section');
  const currentGrade = input.grade;
  const schoolId = get(input, 'school.typeId');
  const batchId = get(input, 'batch.typeId');
  const academicYearId = get(input, 'academicYears[0].typeId');
  if (schoolId && currentGrade && currentSection) {
    const schoolClassId = await addUpdateSchoolClass(
      {
        grade: currentGrade,
        section: currentSection,
      },
      schoolId,
      input.id,
      context,
      academicYearId,
    );
    Object.assign(input, { schoolClass: { type: 'SchoolClass', typeId: schoolClassId } });
    if (batchId) {
      addSchoolSessionOtpInBatchSession(batchId, context);
    }
    const batches = await userBatchQuery(schoolId, currentGrade, currentSection, academicYearId);
    if (batches && batches.length > 0) {
      const studentId = get(input, 'id');
      const inHeritedBatch = batches.filter((batch) => get(batch, 'inheritedFrom.id', null) !== null);
      let masterbatchId = '';
      let batchesConnectIds = [];
      if (inHeritedBatch.length > 0) {
        const masterBatch = batches.filter((batch) => get(batch, 'id') === get(inHeritedBatch, '[0].inheritedFrom.id'));
        masterbatchId = get(masterBatch, '[0].id');
        const remainingInheritedBatches = batches.filter((batch) => get(batch, 'inheritedFrom.id', null) === masterbatchId);
        batchesConnectIds = remainingInheritedBatches.length > 0 && remainingInheritedBatches.map((item) => get(item, 'id'));
      } else {
        masterbatchId = get(batches, '[0].id');
      }
      updateStudentProfile(studentId, masterbatchId, batchesConnectIds);
    }
  }
};

export default addStudentProfilePostHookMethod;

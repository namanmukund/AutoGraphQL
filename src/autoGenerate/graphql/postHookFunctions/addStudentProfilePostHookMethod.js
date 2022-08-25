import { get } from 'lodash';
import addUpdateSchoolClass from './utils/addUpdateSchoolClass';
import addSchoolSessionOtpInBatchSession from './utils/addSchoolSessionOtpInBatchSession';
import { callLocalGraphqlApi } from '../../../api';

const userBatchQuery = async (schoolId, currentGrade, currentSection) => {
  const query = `
  query{
    batches(filter: {
    and: [
      { school_some: { id: "${schoolId}" } }
      { classes_some: { and: [{ grade: ${currentGrade} }, { section: ${currentSection} }] } }
    ]
  }){
    id
  }
}
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.batches');
};

const updateStudentProfile = async (studentId, batchConnectId) => {
  const query = `
  mutation{
    updateStudentProfile(
      id: "${studentId}"
      batchConnectId:"${batchConnectId}"
    ){
      id
    }
  }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data');
};

const addStudentProfilePostHookMethod = async (input, params) => {
  const currentSection = get(params, 'input.section');
  const currentGrade = input.grade;
  const schoolId = get(input, 'school.typeId');
  const batchId = get(input, 'batch.typeId');
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
    if (batchId) {
      addSchoolSessionOtpInBatchSession(batchId);
    }
    const batches = await userBatchQuery(schoolId, currentGrade, currentSection);
    if (batches && batches.length > 0) {
      const studentId = get(input, 'id');
      updateStudentProfile(studentId, get(batches, '[0].id'));
    }
  }
};

export default addStudentProfilePostHookMethod;

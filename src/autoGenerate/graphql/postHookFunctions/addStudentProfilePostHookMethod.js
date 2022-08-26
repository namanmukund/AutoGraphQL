import { get } from 'lodash';
import addUpdateSchoolClass from './utils/addUpdateSchoolClass';
import addSchoolSessionOtpInBatchSession from './utils/addSchoolSessionOtpInBatchSession';
import { callLocalGraphqlApi } from '../../../api';

const getIdArrForQuery = (idArr) => {
  let arr = '';
  if (idArr) {
    idArr.forEach((id) => {
      arr += `"${id}",`;
    });
    if (arr.length && arr[arr.length - 1] === ',') {
      arr.substring(0, arr.length - 1);
    }
  }
  return arr;
};

const userBatchQuery = async (schoolId, currentGrade, currentSection) => {
  const query = `
  query{
    batches(filter: {
    and: [
      { school_some: { id: "${schoolId}" } }
      { classes_some: { and: [{ grade: ${currentGrade} }, { section: ${currentSection} }] } }
      { documentType: classroom }
    ]
  }){
    id
    code
    inheritedFrom {
      id
    }
  }
}
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.batches');
};

const updateStudentProfile = async (studentId, batchConnectId, batchesConnectIds) => {
  const query = `
  mutation{
    updateStudentProfile(
      id: "${studentId}"
      batchConnectId:"${batchConnectId}"
      ${(batchesConnectIds && batchesConnectIds.length) ? `batchesConnectIds: [${getIdArrForQuery(batchesConnectIds)}]` : ''}
    ){
      id
    }
  }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data');
};

const addStudentProfilePostHookMethod = async (input, params, mutationName, context) => {
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
      context,
    );
    Object.assign(input, { schoolClass: { type: 'SchoolClass', typeId: schoolClassId } });
    if (batchId) {
      addSchoolSessionOtpInBatchSession(batchId, context);
    }
    const batches = await userBatchQuery(schoolId, currentGrade, currentSection);
    if (batches && batches.length > 0) {
      const studentId = get(input, 'id');
      const inHeritedBatch = batches.filter((batch) => get(batch, 'inheritedFrom.id', null) !== null);
      if (inHeritedBatch.length > 0) {
        const masterBatch = batches.filter((batch) => get(batch, 'id') === get(inHeritedBatch, '[0].inheritedFrom.id'));
        const MasterbatchId = get(masterBatch, '[0].id');
        const remainingInheritedBatches = batches.filter((batch) => get(batch, 'inheritedFrom.id', null) === MasterbatchId);
        const batchesConnectIds = remainingInheritedBatches.length > 0 && remainingInheritedBatches.map((item) => get(item, 'id'));
        updateStudentProfile(studentId, MasterbatchId, batchesConnectIds);
      }
    }
  }
};

export default addStudentProfilePostHookMethod;

import { get } from 'lodash';
import { callLocalGraphqlApi } from '../../../../api';

export const removeStudentFromBatch = async (studentProfileId, batchId, context) => {
  const mutationStr = `mutation {
  removeFromBatchStudentProfile(studentProfileId: "${studentProfileId}", batchId: "${batchId}") {
    studentProfile {
      id
    }
  }
}`;
  await callLocalGraphqlApi(mutationStr, context);
};

const getBatchDetail = async (schoolId, grade, section, context) => {
  const query = `{
  batches(
    filter: {
      and: [
        { school_some: { id: "${schoolId}" } }
        { classes_some: { and: [{ grade: ${grade} }, { section: ${section} }] } }
        { documentType:classroom }
      ]
    }
  ) {
    id
    type
    documentType
  }
}`;
  const batchRes = await callLocalGraphqlApi(query, context);
  return get(batchRes, 'data.batches[0].id');
};

export const addStudentToBatch = async (input, schoolStudentId, studentProfileId, context) => {
  const newBatchId = await getBatchDetail(schoolStudentId, get(input, 'grade'), get(input, 'section'));
  if (newBatchId) {
    const updateQuery = `mutation {
      addToBatchStudentProfile(studentProfileId: "${studentProfileId}", batchId: "${newBatchId}") {
        studentProfile {
          id
        }
      }
    }`;
    const res = await callLocalGraphqlApi(updateQuery, context);
    return get(res, 'data.addToBatchStudentProfile');
  }
  return true;
};

export const getIdArrForQuery = (idArr) => {
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

export const userBatchQuery = async (schoolId, currentGrade, currentSection, academicYearId) => {
  const query = `
  query{
    batches(filter: {
    and: [
      { school_some: { id: "${schoolId}" } }
      { classes_some: { and: [{ grade: ${currentGrade} }, { section: ${currentSection} }] } }
      {${academicYearId ? `academicYear_some:{id:"${academicYearId}"}` : ''}}
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

export const updateStudentProfile = async (studentId, batchConnectId, batchesConnectIds) => {
  const query = `
  mutation{
    updateStudentProfile(
      id: "${studentId}"
      batchConnectId:"${batchConnectId}"
      ${(batchesConnectIds && batchesConnectIds.length) ? `batchesConnectIds: [${getIdArrForQuery([...batchesConnectIds, batchConnectId])}]` : ''}
    ){
      id
    }
  }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data');
};

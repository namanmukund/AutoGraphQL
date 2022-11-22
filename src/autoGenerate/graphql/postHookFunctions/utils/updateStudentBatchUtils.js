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

import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const batchQuery = (allottedMentorId, courseId, packageId) => `
query{
  batches(filter:{
    and:[
      {
        allocatedMentor_some:{
          id:"${allottedMentorId}"
        }
      }
      ${courseId ? `{
        {
          course_some:{
            id: "${courseId}"
          }
        }
      }` : ''}
      ${packageId ? `{
        {
          coursePackage_some:{
            id: "${packageId}"
          }
        }
      }` : ''}
    ]
  }){
    id
    code
    createdAt
    coursePackage {
      courses {
        id
      }
    }
  }
}
`;

/* eslint-disable no-unused-vars */
const addBatchValidation = async (params, _mutationOrQueryName, context) => {
  const {
    allottedMentorConnectId, courseConnectId, coursePackageConnectId, input = {},
  } = params;
  const batchData = await callLocalGraphqlApi(batchQuery(allottedMentorConnectId, courseConnectId, coursePackageConnectId), context);
  const batchFetched = get(batchData, 'data.batches', []);
  const batchWithSameCode = batchFetched.find((batch) => get(batch, 'code') === get(input, 'code'));
  if (batchWithSameCode && get(input, 'documentType') !== 'classroom') {
    throw new Error('Batch already exists with same code');
  }
  if (batchFetched && !batchFetched.length) {
    throw new Error('Batch already exists with same mentor and course/coursePackage');
  }
};

export default addBatchValidation;

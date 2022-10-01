import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const batchQuery = (allottedMentorId, courseId, packageId) => `
query{
  batches(filter:{
    and:[
      {
        allottedMentor_some:{
          id:"${allottedMentorId}"
        }
      }
      ${courseId ? `{
        course_some:{
          id: "${courseId}"
        }
      }` : ''}
      ${packageId ? `{
        coursePackage_some:{
          id: "${packageId}"
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
  // eslint-disable-next-line no-constant-condition
  if (batchFetched && batchFetched.length && false) {
    throw new Error('Batch already exists with same mentor and course/coursePackage');
  }
};

export default addBatchValidation;

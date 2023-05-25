import { get } from 'lodash';
import { callLocalGraphqlApi } from '../../../api';

const getBatchQuery = (batchId) => `
    query{
      batch(id:"${batchId}"){
        id
        students{
          id
        }
      }
    }
  `;

const updateBatchSubSessionQuery = (
  batchSubSessionId, pushManyQuery,
) => `
  mutation{
    updateBatchSubSession(id:"${batchSubSessionId}", input:{
      ${pushManyQuery}
    }){
      id
    }
  }
  `;

const addBatchSubSessionPostHookMethod = async (input, params, mutationName, context) => {
  const attendance = get(input, 'attendance', []);
  if (attendance.length) return;
  const batchId = get(context, 'activeClassroom');
  const batchResult = await callLocalGraphqlApi(getBatchQuery(batchId), context);
  const batchInfo = get(batchResult, 'data.batch');
  const students = get(batchInfo, 'students', []);
  const batchSubSessionId = get(input, 'id');
  if (students && students.length) {
    let pushManyQuery = 'attendance:{ pushMany: [';
    students.forEach((studentElem) => {
      if (studentElem.id) {
        pushManyQuery += `{studentConnectId: "${studentElem.id}", isPresent: false}, `;
      }
    });
    pushManyQuery += ']}';
    // pushing new array of students in batch session
    callLocalGraphqlApi(updateBatchSubSessionQuery(
      batchSubSessionId,
      pushManyQuery,
    ), context);
  }
};

export default addBatchSubSessionPostHookMethod;

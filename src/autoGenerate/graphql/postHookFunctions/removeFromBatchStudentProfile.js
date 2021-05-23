import { get } from 'lodash';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';

const fetchAllottedBatchSessions = async (batchId) => {
  const query = `
          {
            batchSessions(filter: {and: [{sessionStatus: allotted}, {batch_some: {id: "${batchId}"}}]}) {
              id
              batch {
                id
              }
              attendance {
                student {
                  id
                  user {
                    name
                    id
                  }
                }
                isPresent
                absentReason
              }
            }
          }
          `;
  const batchSessions = await callLocalGraphqlApi(query);
  return get(batchSessions, 'data.batchSessions', []);
};

const updateAttendanceArray = async (batchSession, newArr) => {
  const mutation = `
            mutation{
                  updateBatchSession(id:"${batchSession}", input:{
                    attendance:{
                      replace:${newArr}
                    }
                  }){
                    id
                    attendance {
                      student {
                        id
                        user {
                          name
                          id
                        }
                      }
                      isPresent
                      absentReason
                    }
                  }
                }
                `;
  const updateBatchSessionResponse = await callLocalGraphqlApi(mutation);
  return get(updateBatchSessionResponse, 'data.updateBatchSession', {});
}

const removeStudentFromBatchSessionAttendance = async (batchSession, studentProfileId) => {
  const attendanceArray = get(batchSession, 'attendance', []);

  if (attendanceArray.length > 0) {
    const filteredArray = attendanceArray.filter(item => item.student.id !== studentProfileId);

    const newArr = [];
    for (const item of filteredArray) {
      const obj = {};
      obj.studentConnectId = `"${item.student.id}"`;
      obj.isPresent = item.isPresent;
      obj.absentReason = item.absentReason;
      console.log(obj);
      newArr.push(obj);
    }

    console.log(newArr);

    await updateAttendanceArray(batchSession, newArr);

  }



};


/*
  Post hook of remove from batch student profile
*/
/* eslint-disable no-unused-vars */
const removeFromBatchStudentProfilePosthookMethod = async (input, params, mutationName, context) => {

  const { studentProfileId, batchId } = params;

  const batchSessions = await fetchAllottedBatchSessions(batchId);

  if (batchSessions && batchSessions.length > 0) {
    for (const batchSession of batchSessions) {
      removeStudentFromBatchSessionAttendance(batchSession, studentProfileId);
    }
  }

  // get all the batch sessions which are allotted and 
  // REMOVE all the students objects from the attendance part 
  // pass the remaining to replace 


};

export default removeFromBatchStudentProfilePosthookMethod;

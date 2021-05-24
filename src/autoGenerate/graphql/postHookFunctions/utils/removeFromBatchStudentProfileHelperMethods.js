import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

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

const updateAttendanceArray = async (batchSession, newArrString) => {
  const mutation = `
            mutation{
                  updateBatchSession(id:"${batchSession}", input:{
                    attendance:{
                      replace:${newArrString}
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
};

const removeStudentFromBatchSessionAttendance = async (batchSession, studentProfileId) => {
  const attendanceArray = get(batchSession, 'attendance', []);
  const batchId = get(batchSession, 'id', '');
  if (attendanceArray.length > 0) {
    const filteredArray = attendanceArray.filter(item => item.student.id !== studentProfileId);

    let newArrString = '[';
    for (const item of filteredArray) {
      const objString = `{
        studentConnectId: "${item.student.id}",
        isPresent: ${item.isPresent},
        absentReason: ${item.absentReason},
      },
      `;
      newArrString += objString;
    }
    newArrString += ']'
    // console.log('********** string passed in replace *******');
    // console.log(newArrString);
    const result = await updateAttendanceArray(batchId, newArrString);
    // console.log('********** result *******');
    // console.log(result);
  }
};

export { fetchAllottedBatchSessions, removeStudentFromBatchSessionAttendance };

import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchStudentProfile = async (studentProfileId, batchId) => {
  const query = `
    {
      studentProfiles(filter:
      {
        and: [
          {id: "${studentProfileId}"},
          {batch_some: {id: "${batchId}"}},
        ]
      }
      ){
        id
        batch{
          id
          currentComponent{
            id
            currentCourse{
              id
            }
            currentTopic{
              order
            }
            currentLearningObjective{
              order
            }
            latestSessionStatus
          }
        }
      }
    }
  `;
  const studentProfiles = await callLocalGraphqlApi(query);
  return get(studentProfiles, 'data.batchSessions', []);
};

const fetchUserCurrentTopicComponentStatuses = async (userId) => {
  const query = `
    {
    userCurrentTopicComponentStatuses(
      filter: {user_some:{id:"${userId}"}}
    ){
      id
      currentCourse{
        id
      }
      currentTopic{
        id
        order
      }
      currentLearningObjective{
        id
        order
      }
    }
  }
  `;
  const currentTopicComponent = await callLocalGraphqlApi(query);
  return get(currentTopicComponent, 'data.userCurrentTopicComponentStatuses', []);
};

const fetchNextTopicId = async (topicOrder) => {
  const query = `
    {
      topics(filter: {
        and:[
          {order: ${topicOrder}}
        ]
      }){
        id
        order
        learningObjectives(filter: {order:1}){
          id
        }
      }
    }
  `;
  const topics = await callLocalGraphqlApi(query);
  return get(topics, 'data.topics', []);
};

const updateUserCurrentTopicComponentStatus = async (userCurrentComponentId, topicId, topicComponentType, loId) => {
  const mutation = `
    mutation{
    updateUserCurrentTopicComponentStatus(id: "${userCurrentComponentId}",
      currentTopicConnectId: "${topicId}",
      currentLearningObjectiveConnectId: "${loId}",
      input:{
        currentTopicComponentType:${topicComponentType}
      }
    ){
      id
      currentLearningObjective{
        order
      }
    }
  }
  `;
  const updateResult = await callLocalGraphqlApi(mutation);
  return get(updateResult, 'data.updateUserCurrentTopicComponentStatus', {});
};

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
    const filteredArray = attendanceArray.filter((item) => item.student.id !== studentProfileId);

    let newArrString = '[';
    /*  eslint-disable no-restricted-syntax */
    for (const item of filteredArray) {
      const objString = `{
        studentConnectId: "${item.student.id}",
        isPresent: ${item.isPresent},
        absentReason: ${item.absentReason},
      },
      `;
      newArrString += objString;
    }
    newArrString += ']';
    // console.log('********** string passed in replace *******');
    // console.log(newArrString);
    await updateAttendanceArray(batchId, newArrString);
    // console.log('********** result *******');
  }
};

export {
  fetchAllottedBatchSessions,
  removeStudentFromBatchSessionAttendance,
  fetchStudentProfile,
  fetchUserCurrentTopicComponentStatuses,
  fetchNextTopicId,
  updateUserCurrentTopicComponentStatus,
};

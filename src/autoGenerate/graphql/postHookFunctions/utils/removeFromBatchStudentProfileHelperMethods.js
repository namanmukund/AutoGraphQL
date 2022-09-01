import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { GLOBAL_COURSE_TITLE } from '../../../../../constants';
import getSlotTimesInString from '../../../../../utils/getSlotTimesInString';

const fetchStudentProfile = async (studentProfileId, batchId, context) => {
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
          course{
            id
          }
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
  const studentProfiles = await callLocalGraphqlApi(query, context);
  return get(studentProfiles, 'data.batchSessions', []);
};

const fetchUserCurrentTopicComponentStatuses = async (userId, context) => {
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
  const currentTopicComponent = await callLocalGraphqlApi(query, context);
  return get(currentTopicComponent, 'data.userCurrentTopicComponentStatuses', []);
};

const fetchNextTopicId = async (topicOrder, courseId, context) => {
  const query = `
    {
      topics(filter: {
        and:[
          {order_gt: ${topicOrder}}
          {
            status: published
          }
          {
            courses_some:{
              ${courseId ? `id: "${courseId}"` : `title: "${GLOBAL_COURSE_TITLE}"`}
            }
          }
        ]
      }, orderBy: order_ASC, first: 1){
        id
        order
        learningObjectives(filter: {status: published}, orderBy: order_ASC){
          id
        }
      }
}
  `;
  const topics = await callLocalGraphqlApi(query, context);
  return get(topics, 'data.topics', []);
};

const updateUserCurrentTopicComponentStatus = async (userCurrentComponentId, topicId, topicComponentType, loId, context) => {
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
  const updateResult = await callLocalGraphqlApi(mutation, context);
  return get(updateResult, 'data.updateUserCurrentTopicComponentStatus', {});
};

const fetchAllottedBatchSessions = async (batchId, context) => {
  const query = `
          {
            batchSessions(filter: {and: [{sessionStatus: allotted}, {batch_some: {id: "${batchId}"}}]}) {
              id
              bookingDate
              topic {
                id
                order
              }
              batch {
                id
              }
              ${getSlotTimesInString()}
              attendance {
                student {
                  id
                  user {
                    name
                    id
                  }
                }
                isPresent
                status
                absentReason
              }
            }
          }
          `;
  const batchSessions = await callLocalGraphqlApi(query, context);
  return get(batchSessions, 'data.batchSessions', []);
};

const updateAttendanceArray = async (batchSession, newArrString, context) => {
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
                      status
                      absentReason
                    }
                  }
                }
                `;
  const updateBatchSessionResponse = await callLocalGraphqlApi(mutation, context);
  return get(updateBatchSessionResponse, 'data.updateBatchSession', {});
};

const removeStudentFromBatchSessionAttendance = async (batchSession, studentProfileId, context) => {
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
        status: ${item.status},
        absentReason: ${item.absentReason},
      },
      `;
      newArrString += objString;
    }
    newArrString += ']';
    // console.log('********** string passed in replace *******');
    // console.log(newArrString);
    await updateAttendanceArray(batchId, newArrString, context);
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

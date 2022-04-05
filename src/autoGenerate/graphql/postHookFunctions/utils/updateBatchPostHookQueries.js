import { get } from 'lodash';
import { GLOBAL_COURSE_TITLE } from '../../../../../constants';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

// query to get published topics count
const getTopics = async (courseId) => {
  const query = `
          {
            topics(filter: 
              {
                and: [
                  {status: published},
                  {chapter_some: {courses_some: {${courseId ? `id: "${courseId}"` : `title: "${GLOBAL_COURSE_TITLE}"`}}}}
                ]
              }, orderBy: order_ASC){
              id
              order
            }
          }
          `;
  const topicMeta = await callLocalGraphqlApi(query);
  return get(topicMeta, 'data.topics');
};

// query to get batch sessions
const getBatchSessions = async (batchId, bookingDate, slot, sessionStatus) => {
  const query = `
          {
            batchSessions(filter: {
              and: [
                {batch_some: {id: "${batchId}"}}
                ${bookingDate ? `{bookingDate: "${bookingDate}"}` : ''}
                ${slot ? `{slot${slot}: true}` : ''}
                ${sessionStatus ? `{sessionStatus: ${sessionStatus}}` : ''}
              ]
            }, orderBy:bookingDate_ASC){
              id
              bookingDate
              sessionStatus
              course{
                id
              }
              topic{
                order
              }
            }
          }
          `;
  const batches = await callLocalGraphqlApi(query);
  return get(batches, 'data.batchSessions');
};

// query to get adhoc sessions
const getAdhocSessions = async (batchId, bookingDate, slot, sessionStatus) => {
  const query = `
          {
            adhocSessions(filter: {
              and: [
                {batch_some: {id: "${batchId}"}}
                ${bookingDate ? `{bookingDate: "${bookingDate}"}` : ''}
                ${slot ? `{slot${slot}: true}` : ''}
                ${sessionStatus ? `{sessionStatus: ${sessionStatus}}` : ''}
              ]
            }, orderBy:bookingDate_ASC){
              id
              bookingDate
              sessionStatus
              previousTopic{
                order
              }
            }
          }
          `;
  const sessions = await callLocalGraphqlApi(query);
  return get(sessions, 'data.adhocSessions');
};

// query to get batch sessions (started, completed)
const getBatch = async (batchId) => {
  const query = `
          {
            batch(id:"${batchId}"){
              id
              timeTableRule{
                startDate
                endDate
                slot0
                slot1
                slot2
                slot3
                slot4
                slot5
                slot6
                slot7
                slot8
                slot9
                slot11
                slot12
                slot13
                slot14
                slot15
                slot16
                slot17
                slot18
                slot19
                slot20
                slot21
                slot22
                slot23
                sunday
                monday
                tuesday
                wednesday
                thursday
                friday
                saturday
              }
            }
          }
          `;
  const currBatch = await callLocalGraphqlApi(query);
  return get(currBatch, 'data.batch');
};

const createBatchSession = async (batchId, date, slots, topicId, mentorSessionId, courseId, coursePackageId, startTime, endTime, sessionMode) => {
  const query = `
          mutation{
            addBatchSession(batchConnectId: "${batchId}",
            ${topicId ? `topicConnectId: "${topicId}"` : ''}
            ${mentorSessionId ? `mentorSessionConnectId: "${mentorSessionId}"` : ''}
            ${courseId ? `courseConnectId: "${courseId}"` : ''}
            ${coursePackageId ? `coursePackageConnectId: "${coursePackageId}"` : ''}
            input:{
              bookingDate:"${date}",
              ${startTime ? `startMinutes: ${startTime},` : ''}
              ${endTime ? `endMinutes: ${endTime},` : ''}
              ${sessionMode ? `sessionMode: ${sessionMode},` : ''}
              ${slots}
            }
            ){
              id
            }
          }
          `;
  await callLocalGraphqlApi(query);
  return true;
};

const updateBatchSession = async (sessionId, slots, date, mentorSessionId, courseId, coursePackageId, startTime, endTime, sessionMode) => {
  const query = `
          mutation{
            updateBatchSession(
            id: "${sessionId}",
            ${mentorSessionId ? `mentorSessionConnectId: "${mentorSessionId}"` : ''}
            ${courseId ? `courseConnectId: "${courseId}"` : ''}
            ${coursePackageId ? `coursePackageConnectId: "${coursePackageId}"` : ''}
            input:{
              bookingDate:"${date}",
              ${startTime ? `startMinutes: ${startTime},` : ''}
              ${endTime ? `endMinutes: ${endTime},` : ''}
              ${sessionMode ? `sessionMode: ${sessionMode},` : ''}
              ${slots}
            }
            ){
              id
            }
          }
          `;
  await callLocalGraphqlApi(query);
  return true;
};

const createAdhocSession = async (batchId, date, slots, topicId, mentorSessionId, courseId, adhocSessionType, coursePackageId, startTime, endTime, sessionMode) => {
  const query = `
          mutation{
            addAdhocSession(batchConnectId: "${batchId}",
            ${topicId ? `previousTopicConnectId: "${topicId}"` : ''}
            ${mentorSessionId ? `mentorSessionConnectId: "${mentorSessionId}"` : ''}
            ${courseId ? `courseConnectId: "${courseId}"` : ''}
            ${coursePackageId ? `coursePackageConnectId: "${coursePackageId}"` : ''}
            input:{
              bookingDate:"${date}",
              type: ${adhocSessionType}
              ${startTime ? `startMinutes: ${startTime},` : ''}
              ${endTime ? `endMinutes: ${endTime},` : ''}
              ${sessionMode ? `sessionMode: ${sessionMode},` : ''}
              ${slots}
            }
            ){
              id
            }
          }
          `;
  await callLocalGraphqlApi(query);
  return true;
};

const updateAdhocSession = async (sessionId, slots, date, mentorSessionId, courseId, startTime, endTime, sessionMode) => {
  const query = `
          mutation{
            updateAdhocSession(
            id: "${sessionId}",
            ${mentorSessionId ? `mentorSessionConnectId: "${mentorSessionId}"` : ''}
            ${courseId ? `courseConnectId: "${courseId}"` : ''}
            input:{
              bookingDate:"${date}",
              ${startTime ? `startMinutes: ${startTime},` : ''}
              ${endTime ? `endMinutes: ${endTime},` : ''}
              ${sessionMode ? `sessionMode: ${sessionMode},` : ''}
              ${slots}
            }
            ){
              id
            }
          }
          `;
  await callLocalGraphqlApi(query);
  return true;
};

const getBatchSession = (batchId,
  topicId) => `
  {
    batchSessions(filter:{
      and:[
        {batch_some:{id:"${batchId}"}}
        {topic_some:{id: "${topicId}"}}
      ]
    }){
      id
      bookingDate
    }
  }
`;

const getAdhocSession = (batchId,
  topicId) => `
  {
    adhocSessions(filter:{
      and:[
        {batch_some:{id:"${batchId}"}}
        {previousTopic_some:{id: "${topicId}"}}
      ]
    }){
      id
      bookingDate
    }
  }
`;

const getTopicsFromCoursePackage = async (coursePackageId) => {
  const query = `
  query{
  coursePackage(id: "${coursePackageId}"){
    topics{
      order
      topic{
        courses{
          id
        }
        id
      }
    }
  }
}
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.coursePackage');
};

const getCourseIdFromTopic = async (topicId) => {
  const query = `
  {
  topic(id: "${topicId}"){
    courses{
      id
    }
  }
}
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.topic.courses[0].id');
};

/* eslint-disable object-curly-newline */
export { getTopics, getBatchSessions, getBatch, createBatchSession, updateBatchSession, createAdhocSession, getAdhocSessions, updateAdhocSession, getBatchSession, getAdhocSession, getTopicsFromCoursePackage, getCourseIdFromTopic };

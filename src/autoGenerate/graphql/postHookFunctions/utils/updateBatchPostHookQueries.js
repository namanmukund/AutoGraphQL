import { get } from 'lodash';
import { GLOBAL_COURSE_TITLE } from '../../../../../constants';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

// query to get published topics count
const getTopicMeta = async () => {
  const query = `
          {
            topicsMeta(filter: 
              {
                and: [
                  {status: published},
                  {chapter_some: {courses_some: {title: ${GLOBAL_COURSE_TITLE}}}}
                ]
              }){
              count
            }
          }
          `;
  const topicMeta = await callLocalGraphqlApi(query);
  return get(topicMeta, 'data.topicsMeta');
};

// query to get batch sessions (started, completed)
const getBatchSessions = async (batchId) => {
  const query = `
          {
            batchSessions(filter: {batch_some: {id: "${batchId}"}}){
              id
              bookingDate
            }
          }
          `;
  const batches = await callLocalGraphqlApi(query);
  return get(batches, 'data.batchSessions');
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

const createBatchSession = async (batchId, date, slots) => {
  const query = `
          mutation{
            addBatchSession(batchConnectId: "${batchId}",
            input:{
              bookingDate:"${date}",
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

const updateBatchSession = async (sessionId, slots, date) => {
  const query = `
          mutation{
            updateBatchSession(batchConnectId: "${sessionId}",
            input:{
              bookingDate:"${date}",
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

/* eslint-disable object-curly-newline */
export { getTopicMeta, getBatchSessions, getBatch, createBatchSession, updateBatchSession };

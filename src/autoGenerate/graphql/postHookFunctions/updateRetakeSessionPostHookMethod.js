/* eslint-disable no-console */
import { get } from 'lodash';
import { sessionStatus } from '../../../../constants';
import { callLocalGraphqlApi } from '../../../api';
import addBatchSubSession from '../../utils/addBatchSubSession';
import updateBatchSubSession from '../../utils/updateBatchSubSession';

const deleteBatchScheduleSession = async (retakeSessionId, context) => {
  const deleteQuery = `mutation {
  deleteSchoolSessionOtps(
    filter: { batchSession_some: { retakeSessions_some: { id: "${retakeSessionId}" } } }
  ) {
    id
  }
}
`;
  await callLocalGraphqlApi(deleteQuery, context);
};

const batchSessionQuery = (id) => `{
  batchSession(id: "${id}") {
    id
    subSessions {
      id
      createdAt
    }
  }
}`;

const getBatchQuery = (batchId) => `
    query{
      batch(id:"${batchId}"){
        students{
          id
        }
      }
    }
  `;

const getSubBatchSessionList = (students = []) => {
  const pushStudents = [];
  // eslint-disable-next-line no-unused-expressions
  students.length && students.forEach((studentElem) => {
    if (studentElem.id) {
      const obj = {
        studentConnectId: studentElem.id,
        isPresent: false,
      };
      pushStudents.push(obj);
    }
  });
  return pushStudents;
};

const getLatestSubSession = async (batchSessionId, context) => {
  const batchSessionRes = await callLocalGraphqlApi(batchSessionQuery(batchSessionId), context);
  const subSessions = get(batchSessionRes, 'data.batchSession.subSessions', []);
  let latestSubSession;
  if (subSessions.length) {
    const tempSubSessions = [...subSessions];
    tempSubSessions.sort((a, b) => new Date(get(b, 'createdAt')) - new Date(get(a, 'createdAt')));
    latestSubSession = tempSubSessions[0];
  }
  return latestSubSession;
};

const updateRetakeSessionPostHookMethod = async (input, params, mutationName, context) => {
  const retakeSessionId = get(input, 'id');
  const retakeSessionStatusFromInput = get(params, 'input.sessionStatus', 'allotted');
  const allottedMentorId = get(context, 'allottedMentorId');
  const batchSessionConnectId = get(input, 'batchSession.typeId');
  if (get(input, 'sessionStatus') === 'started') {
    const batchId = get(context, 'batchId');
    const batchResult = await callLocalGraphqlApi(getBatchQuery(batchId), context);
    const batchInfo = get(batchResult, 'data.batch');
    const students = get(batchInfo, 'students', []);
    const inputToSend = {
      sessionStartDate: `${get(input, 'sessionStartDate')}`,
      type: 'retake',
      subType: 'initial',
      sessionStatus: get(input, 'sessionStatus'),
    };
    if (students && students.length) {
      inputToSend.attendance = getSubBatchSessionList(students);
    }
    try {
      addBatchSubSession(inputToSend, allottedMentorId, batchSessionConnectId, context);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('error ', e);
    }
  }
  if (get(input, 'sessionStatus') === 'completed') {
    const latestSubSession = await getLatestSubSession(batchSessionConnectId, context);
    if (latestSubSession) {
      const latestSubSessionId = get(latestSubSession, 'id');
      const inputToSend = {
        sessionStartDate: `${get(input, 'sessionStartDate')}`,
        sessionEndDate: `${get(input, 'sessionEndDate')}`,
        sessionStatus: get(input, 'sessionStatus'),
      };
      try {
        updateBatchSubSession(latestSubSessionId, inputToSend, context);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('error ', e);
      }
    }
  }
  if (retakeSessionStatusFromInput === sessionStatus.completed) {
    const { prevRetakeSessionStatus } = context;
    if (prevRetakeSessionStatus && prevRetakeSessionStatus !== retakeSessionStatusFromInput) {
      deleteBatchScheduleSession(retakeSessionId, context);
    }
  }
};

export default updateRetakeSessionPostHookMethod;

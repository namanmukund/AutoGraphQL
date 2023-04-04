/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import { callLocalGraphqlApi } from '../../../../../api';
import MasterController from '../../../controllers/MasterController';

const updateBatchDetailsForReports = async () => {
  const fetchSessions = async (classroomIds, topicIds) => {
    const usersRes = await callLocalGraphqlApi(`{
  batchSessions(
    filter: {
      and: [
        { batch_some: { id_in: [${classroomIds}] } }
        { topic_some: { id_in: [${topicIds}] } }
      ]
    }
  ) {
    id
    batch {
      id
    }
    topic {
      id
    }
  }
}`);
    return get(usersRes, 'data.batchSessions', []);
  };
  const userSessionReportController = new MasterController('UserLevelSessionReport', { bypass: true });
  const userSessionReports = await userSessionReportController.Model.findAll({
    where: {
      sessionId: null,
    },
    raw: true,
  });
  let topicIds = '';
  let classroomIds = '';
  for (const userSessionReport of userSessionReports) {
    const { classroomId, topicId } = userSessionReport;
    if (topicId) topicIds += `"${topicId}",`;
    if (classroomId) classroomIds += `"${classroomId}",`;
  }
  const batchSessions = await fetchSessions(classroomIds, topicIds);
  const sessionDetailsArray = [];
  for (const userSessionReport of userSessionReports) {
    const { classroomId, topicId } = userSessionReport;
    const batchSession = batchSessions.find((session) => get(session, 'batch.id') === classroomId && get(session, 'topic.id') === topicId);
    const isAlreadyAdded = sessionDetailsArray.find((session) => get(session, 'id') === get(batchSession, 'id'));
    if (!isAlreadyAdded) sessionDetailsArray.push(batchSession);
  }
};

export default updateBatchDetailsForReports;

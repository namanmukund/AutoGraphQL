import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const getBatchSessions = async () => {
  const query = `
    query{
        batchSessions(filter:{attendance_isPresent_subDoc_exists: true}) {
            id
            attendance {
                isPresent
                status
            }
        }
    }
`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.batchSessions', []);
};

const updateBatchSession = async (id, isPresent, status) => {
  const query = `
    mutation {
      updateBatchSession(
        id:"${id}",
        input:{
            attendance: {
                updateWhere: {
                    isPresent: ${isPresent}
                }
                updateWith: {
                    status: ${status}
                }
            }
        }) {
            id
        }
    }
  `;
  const res = await callLocalGraphqlApi(query, { attendanceMigration: true });
  return get(res, 'data.updateBatchSession.id');
};

const migrateBatchAttendanceToEnum = async () => {
  const batchSessions = await getBatchSessions();
  if (batchSessions && batchSessions.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const session of batchSessions) {
        const sessionId = get(session, 'id');
        if (sessionId) {
            // eslint-disable-next-line no-await-in-loop
            await updateBatchSession(sessionId, true, 'present');
            await updateBatchSession(sessionId, false, 'absent');
        }
    }
  }
};

export default migrateBatchAttendanceToEnum;

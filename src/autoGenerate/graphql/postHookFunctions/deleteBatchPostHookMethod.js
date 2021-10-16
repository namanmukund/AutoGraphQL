import deleteBatchSessionsQuery from './utils/deleteBatchSessionsQuery';

const deleteBatchPostHookMethod = async (input, params, mutationName, context) => {
  const {
    batchSessions,
  } = context;
  if (batchSessions && batchSessions.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const batchSession of batchSessions) {
      if (batchSession && batchSession.id) {
        deleteBatchSessionsQuery(batchSession.id);
      }
    }
  }
};
export default deleteBatchPostHookMethod;

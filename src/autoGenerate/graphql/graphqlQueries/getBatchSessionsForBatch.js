const getBatchSessionForBatch = (batchId) => `
{
  batchSessions(filter: { batch_some: { id: "${batchId}" } }) {
    id
  }
}

`;

export default getBatchSessionForBatch;

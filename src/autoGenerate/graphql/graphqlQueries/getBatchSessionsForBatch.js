const getBatchSessionForBatch = (batchId) => `
{
  batchSessions(
    filter: {
      and: [
        { bookingDate_gte: "${new Date(new Date().setHours(0, 0, 0, 0)).toISOString()}" }
        { sessionStatus_not: completed }
        { batch_some: { id: "${batchId}" } }
      ]
     }
  ) {
    id
  }
}
`;

export default getBatchSessionForBatch;

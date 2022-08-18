const RetakeSession = `
  type RetakeSession @model
  {
    batchSession: BatchSession @relation(name: "RetakeSessionBatchSession")
    sessionStatus: SessionStatus! @defaultValue(value: "allotted")
    sessionStartDate: Date
    sessionEndDate: Date
}`;

export default [RetakeSession];

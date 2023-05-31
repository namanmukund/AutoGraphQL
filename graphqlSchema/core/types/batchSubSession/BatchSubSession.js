const BatchSubSession = `
    type BatchSubSession @model {
        sessionStartDate: Date
        sessionEndDate: Date
        duration: Int
        type: BatchSubSessionType! @defaultValue(value: "live")
        subType: BatchSubSessionSubType! @defaultValue(value: "initial")
        sessionStatus: SessionStatus! @defaultValue(value: "allotted")
        mentor: User @relation(name: "BatchSubSessionMentor", direction: "OneWay")
        batchSession: BatchSession @relation(name: "BatchSubSessionBatchSession")
        attendance: [BatchAttendanceType]
    }
`;

export default [BatchSubSession];

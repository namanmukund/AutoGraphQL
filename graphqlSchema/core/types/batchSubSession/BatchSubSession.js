const BatchSubSession = `
    type BatchSubSession @model {
        date: Date
        type: BatchSubSessionType! @defaultValue(value: "live")
        subType: BatchSubSessionSubType! @defaultValue(value: "initial")
        sessionStatus: SessionStatus! @defaultValue(value: "allotted")
        mentorId: [MentorProfile] @relation(name: "BatchSubSessionMentor", direction: "OneWay")
        batchSessionId: [BatchSession] @relation(name: "BatchSubSession", direction: "OneWay")
    }
`;

export default [BatchSubSession];

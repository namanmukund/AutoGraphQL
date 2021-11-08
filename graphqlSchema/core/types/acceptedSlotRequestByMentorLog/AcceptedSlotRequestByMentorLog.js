const AcceptedSlotRequestByMentorLog = `
  type AcceptedSlotRequestByMentorLog @model {
    date: Date!
    slotName: Slot!
    requestType: RequestType!
    sessionType: SessionType @defaultValue(value: "trial")
    mentor: MentorProfile! @relation(name:"AcceptedSlotRequestByMentorLogMentorProfile", direction: "OneWay")
    mentorAvailabilitySlot: MentorAvailabilitySlot @relation(name:"MentorAvailabilitySlotAcceptedSlotRequestByMentorLog", direction: "OneWay")
    menteeSession: MenteeSession @relation(name:"AcceptedSlotRequestByMentorLogMenteeSession", direction: "OneWay")
    batchSession: BatchSession @relation(name:"AcceptedSlotRequestByMentorLogBatchSession", direction: "OneWay")
    reason: RequestReason
    action: String
  }
`;
export default AcceptedSlotRequestByMentorLog;

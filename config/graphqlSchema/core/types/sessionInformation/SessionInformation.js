const SessionInformation = `
  type SessionInformation @model {
    topic: Topic! @relation(name: "SessionDataTopic", direction: "OneWay")
    menteeSession: MenteeSession @relation(name: "SessionDataMenteeSession", direction: "OneWay")
    mentorSession: MentorSession @relation(name: "SessionDataMentorSession", direction: "OneWay")
    slotSession : SlotSession @relation(name: "SessionDataSlotSession", direction: "OneWay")
    startDate: Date
    endDate: Date
    mentorStartTime: Date
    mentorEndTime: Date
    isHomeworkChecked: Boolean @defaultValue(value: false)
}`;

export default [SessionInformation];

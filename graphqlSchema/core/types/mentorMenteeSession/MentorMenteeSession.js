const MentorMenteeSession = `
  type MentorMenteeSession @model {
    menteeSession: MenteeSession @relation(name: "SessionDataMenteeSession", direction: "OneWay")
    mentorSession: MentorSession @relation(name: "SessionDataMentorSession", direction: "OneWay")
    slots: AvailableSlot @relation(name: "SessionDataAvailableSlots", direction: "OneWay")
    startDate: Date
    endDate: Date
    mentorStartTime: Date
    mentorEndTime: Date
    isHomeworkChecked: Boolean @defaultValue(value: false)
}`;

export default [MentorMenteeSession];

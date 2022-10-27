const SessionFeedbackFieldRule = `
  type SessionFeedbackFieldRule {
    tag: SessionFeedbackTag
    liked: Boolean
 }`;

const SessionFeedback = `
  type SessionFeedback @model
  {
    user: User! @relation(name: "MenteeSessionUser", direction: "OneWay")
    course: Course @relation(name: "SessionFeedbackCourse", direction: "OneWay")
    coursePackage: CoursePackage @relation(name: "SessionFeedbackCoursePackage", direction: "OneWay")
    batch: Batch! @relation(name: "SessionFeedbackBatch", direction: "OneWay")
    topic: Topic @relation(name: "SessionFeedbackTopic", direction: "OneWay")
    rating: Int @length(min: 1, max: 5) @groupBy
    studentComment: String
    selectedFields: [SessionFeedbackFieldRule]
    feedbackType: SessionFeedbackType
}`;

export default [SessionFeedback, SessionFeedbackFieldRule];

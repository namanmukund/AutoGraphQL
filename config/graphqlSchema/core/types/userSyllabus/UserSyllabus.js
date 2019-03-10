const syllabusMcqAnswerType = `
  type SyllabusMcqAnswerType {
   statement: String
   order: Int
 }`;

const syllabusFibInputAnswerType = `
  type SyllabusFibInputAnswerType {
   correctPosition: Int
   answers: [String]
 }`;

const syllabusFibBlockAnswerType = `
  type SyllabusFibBlockAnswerType {
   displayOrder: Int
   statement: String
   correctPositions: [Int]
 }`;

const syllabusArrangeAnswerType = `
  type SyllabusArrangeAnswerType {
   displayOrder: Int
   statement: String
   correctPosition: Int
 }`;

const currentPracticeQuestion = `
  type CurrentPracticeQuestion {
   question: QuestionBank @relation(name: "QuestionUserSyllabus", direction: "OneWay")
   questionDisplayOrder: Int
   attempCount: Int
   isHintused: Boolean @defaultValue(value: "false")
   isAnswerUsed: Boolean @defaultValue(value: "false")
   mcqAnswer: [SyllabusMcqAnswerType]
   fibInputAnswer: [SyllabusFibInputAnswerType]
   fibBlockAnswer: [SyllabusFibBlockAnswerType]
   arrangeAnswer: [SyllabusArrangeAnswerType]
 }`;

const UserSyllabus = `
  type UserSyllabus @model {
    user: User! @relation(name: "UserSyllabus", direction: "OneWay")
    course: Course! @relation(name: "UserSyllabusCourse", direction: "OneWay")
    enrollmentType: EnrollmentType! @defaultValue(value: "free")
    currentChapter: Chapter! @relation(name: "UserSyllabusChapter", direction: "OneWay")
    currentTopic: Topic! @relation(name: "UserSyllabusTopic", direction: "OneWay")
    currentLO: LearningObjective @relation(name: "LearningObjectiveUserSyllabus", direction: "OneWay")
    currentMessage: Message @relation(name: "MessageUserSyllabus", direction: "OneWay")
    currentPQ: [CurrentPracticeQuestion]
    consumingComponent: CurrentComponentType
  }
`;

export default [UserSyllabus, currentPracticeQuestion, syllabusMcqAnswerType,
  syllabusFibInputAnswerType, syllabusFibBlockAnswerType, syllabusArrangeAnswerType];

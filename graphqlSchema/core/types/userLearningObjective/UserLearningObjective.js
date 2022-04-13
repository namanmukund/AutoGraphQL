const practiceQuestionsUserLearningObjectiveType = `
  type PracticeQuestionsUserLearningObjectiveType {
   question: QuestionBank @relation(name: "QuestionUserLearningObjective", direction: "OneWay")
   isHintUsed: Boolean @defaultValue(value: "false")
   isAnswerUsed: Boolean @defaultValue(value: "false")
   attemptNumber: Int @defaultValue(value: 0)
   status: UserTopicTypeStatus @defaultValue(value: "incomplete")
   startTime: Date
   endTime: Date
 }`;

const userLearningObjectivenextComponentType = `
  type UserLearningObjectiveNextComponentType {
   learningObjective: LearningObjective @relation(name: "UserLearningObjectiveNextComponentTypeLO", direction: "OneWay")
   nextComponentType: CurrentTopicComponentType
   topic: Topic @relation(name: "UserLearningObjectiveNextComponentTypeTopic", direction: "OneWay")
   blockBasedProject: BlockBasedProject @relation(name: "UserLearningObjectiveNextComponentTypeProject", direction: "OneWay")
 }`;

const UserLearningSlideType = `
  type UserLearningSlideType {
    learningSlide: LearningSlide @relation(name: "UserLearningSlideTypeLearningSlide", direction: "OneWay")
    status: UserTopicTypeStatus @defaultValue(value: "incomplete")
    startTime: Date
    endTime: Date
  }`;

const UserLearningObjective = `
  type UserLearningObjective @model {
    user: User! @relation(name: "UserLearningObjective", direction: "OneWay")
    learningObjective: LearningObjective! @relation(name: "UserLearningObjectiveLearningObjective", direction: "OneWay")
    chatStatus: UserTopicTypeStatus @defaultValue(value: "incomplete")
    isChatBookmarked: Boolean @defaultValue(value: "false")
    practiceQuestions: [PracticeQuestionsUserLearningObjectiveType]
    practiceQuestionStatus: UserTopicTypeStatus @defaultValue(value: "incomplete")
    isPracticeQuestionBookmarked: Boolean @defaultValue(value: "false")
    comicStripStatus: UserTopicTypeStatus @defaultValue(value: "incomplete")
    isComicStripBookmarked: Boolean @defaultValue(value: "false")
    learningSlideStatus: UserTopicTypeStatus @defaultValue(value: "incomplete")
    isLearningSlideBookmarked: Boolean @defaultValue(value: "false")
    nextComponent: UserLearningObjectiveNextComponentType
    course: Course @relation(name: "UserLearningObjectiveCourse", direction: "OneWay")
    learningSlides: [UserLearningSlideType]
  }
`;

export default [UserLearningObjective, practiceQuestionsUserLearningObjectiveType,
  userLearningObjectivenextComponentType, UserLearningSlideType];

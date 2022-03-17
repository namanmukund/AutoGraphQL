const LearningSlide = `
  type LearningSlide @model
  {
    name: String!
    type: LearningSlideType
    layoutType: LayoutType
    order: Int
    status: ContentStatus! @defaultValue(value: "unpublished")
    slideContents: [LearningSlideContent] @relation(name: "LearningSlideSlides")
    practiceQuestions: [QuestionBank] @relation(name: "LearningSlideQuestionBank", direction: "OneWay")
    topics: [Topic] @relation(name: "LearningSlideTopic")
    courses: [Course] @relation(name: "LearningSlideCourse", direction: "OneWay")
    learningObjectives: [LearningObjective] @relation(name: "LearningSlideLearningObjective")
  }
`;

export default LearningSlide;

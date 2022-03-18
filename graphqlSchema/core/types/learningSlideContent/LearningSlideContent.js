const LearningSlideContent = `
  type LearningSlideContent @model  
  {
    type: LearningSlideContentType!
    gridPlacement: Int
    media: File @relation(name: "LearningSlideContentFile", direction: "OneWay")
    statement: String @length(min: 3, max: 1000) @trim
    url: String 
    codeInput: String
    codeOutput: String
    learningSlides: [LearningSlide] @relation(name: "LearningSlideSlides")
  }
`;

export default LearningSlideContent;

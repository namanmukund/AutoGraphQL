const LearningSlideContent = `
  type LearningSlideContent @model  
  {
    type: LearningSlideContentType!
    gridPlacement: String
    media: File @relation(name: "LearningSlideContentFile", direction: "OneWay")
    statement: String @trim
    url: String 
    codeInput: String
    codeOutput: String
    codeEditorConfig: CodeEditorConfig
    learningSlides: [LearningSlide] @relation(name: "LearningSlideSlides")
  }
`;

export default LearningSlideContent;

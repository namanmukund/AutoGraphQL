const TechTalk = `
  type TechTalk @model {
    createdAt: Date @readOnly
    updatedAt: Date @readOnly
    learningObjective: LearningObjective @relation(name: "LearningObjectiveTechTalk")
    messages: [Message] @relation(name: "TechTalkMessage", direction: "OneWay", isSubset: true)
    status: ContentStatus! @defaultValue(value: "unpublished")
  }
`;

export default TechTalk;

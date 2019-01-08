const TechTalk = `
  type TechTalk @model {
    createdAt: Date @readOnly
    updatedAt: Date @readOnly
    learningObjective: LearningObjective @relation(name: "LearningObjectiveTechTalk")
    chats: [Chat] @relation(name: "TechTalkChat", direction: "OneWay", isSubset: true)
    status: ContentStatus! @defaultValue(value: "unpublished")
  }
`;

export default TechTalk;

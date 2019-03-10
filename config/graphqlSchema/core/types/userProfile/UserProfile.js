const feedbackType = `
  type FeedbackType {
   statement: String
   isResolved: Boolean  @defaultValue(value: "false")
   isReplied: Boolean  @defaultValue(value: "false")
 }`;

const UserProfile = `
  type UserProfile @model {
    user: User! @relation(name: "UserProfile", direction: "OneWay")
    topicsCompleted: Int
    charactersUnlocked: [String]
    passwordUpdateDate: Date
    feedback: [FeedbackType]
    proficientTopics: [Topic] @relation(name: "ProficientTopicUserProfile", direction: "OneWay")
    proficientTopicCount: Int @length(min: 0, max: 50) @defaultValue(value: 0)
    freeProficientTopicCount: Int @length(min: 0, max: 5) @defaultValue(value: 5)
    masteredTopics: [Topic] @relation(name: "MasteredTopicUserProfile", direction: "OneWay")
    masteredTopicCount: Int @length(min: 0, max: 50) @defaultValue(value: 0)
    freeMasteredTopicCount: Int @length(min: 0, max: 5) @defaultValue(value: 5)
    familiarTopics: [Topic] @relation(name: "FamiliarTopicUserProfile", direction: "OneWay")
    familiarTopicCount: Int @length(min: 0, max: 50) @defaultValue(value: 0)
    freeFamiliarTopicCount: Int @length(min: 0, max: 5) @defaultValue(value: 5)
  }
`;

export default [UserProfile, feedbackType];

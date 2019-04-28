import { freeTopicCount } from '../../../../../constants';

const UserProfile = `
  type UserProfile @model {
    user: User! @relation(name: "UserProfile", direction: "OneWay")
    topicsCompleted: Int
    totalTopics: [Topic] @relation(name: "TotalTopicUserProfile", direction: "OneWay")
    charactersUnlocked: [String]
    proficientTopics: [Topic] @relation(name: "ProficientTopicUserProfile", direction: "OneWay")
    proficientTopicCount: Int @length(min: 0, max: 50) @defaultValue(value: 0)
    freeProficientTopicCount: Int @length(min: 0, max: 5) @defaultValue(value: ${freeTopicCount})
    masteredTopics: [Topic] @relation(name: "MasteredTopicUserProfile", direction: "OneWay")
    masteredTopicCount: Int @length(min: 0, max: 50) @defaultValue(value: 0)
    freeMasteredTopicCount: Int @length(min: 0, max: 5) @defaultValue(value: ${freeTopicCount})
    familiarTopics: [Topic] @relation(name: "FamiliarTopicUserProfile", direction: "OneWay")
    familiarTopicCount: Int @length(min: 0, max: 50) @defaultValue(value: 0)
    freeFamiliarTopicCount: Int @length(min: 0, max: 5) @defaultValue(value: ${freeTopicCount})
  }
`;

export default [UserProfile];

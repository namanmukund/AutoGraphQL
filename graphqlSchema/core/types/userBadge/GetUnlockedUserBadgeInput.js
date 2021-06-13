const GetUnlockedUserBadgeInput = `
  input GetUnlockedUserBadgeInput {
    topicId: ID!
    courseId: ID
    component: CurrentTopicComponentType!
  }`;

export default [GetUnlockedUserBadgeInput];

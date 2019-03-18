import {ADD, META_QUERY, SINGULAR, UPDATE} from '../../../../../constants/graphqlOperations';

const LearningObjective = `
  type LearningObjective @model 
  @allowedApps(list:["tekieTms", "appTwo"]) 
  @allowedUsers(list:["admin", "student"])
  @allowedOperations(list:["${ADD}", "${SINGULAR}", "${META_QUERY}", "${UPDATE}"])
  {
    order: Int! 
           @allowedApps(list:["tekieTmsw", "appTwo"])
           @allowedUsers(list:["tekie", "student"])
    title: String! 
           @unique 
           @length(min: 6, max: 120) 
           @trim
    description: String 
           @uniqueOrEmpty 
           @unique @length(min: 6, max: 120) 
           @trim
    videoStartTime: Int
    videoEndTime: Int
    topic: Topic @relation(name: "TopicLearningObjective") 
           @allowedApps(list:["tekieTms"]) 
    messages: [Message] @relation(name: "LearningObjectiveMessage", isSubset: true)
    questionBank: [QuestionBank] @relation(name: "LearningObjectiveQuestionBank", isSubset: true)
    status: ContentStatus! @defaultValue(value: "unpublished")
    thumbnail: File @relation(name: "LearningObjectiveThumbnail", direction: "OneWay")
    messageStatus: ContentStatus! @defaultValue(value: "unpublished")
  }
`;

export default LearningObjective;

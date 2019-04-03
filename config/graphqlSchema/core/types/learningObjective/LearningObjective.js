import { ADD, META_QUERY, SINGULAR, UPDATE } from '../../../../../constants/graphqlOperations';

const LearningObjective = `
  type LearningObjective @model 
  @appPermissions(permissions:[{
        appName: "tekieTms"
        operations: ["${ADD}", "${SINGULAR}"]
  }, {
        appName: "appTwo"
        operations: ["${ADD}", "${SINGULAR}"]
  },  
  {
        appName: "three"
        operations: "*"
  },
    {
        appName: "four"
        operations: "*"
  }
  ], rule: allow)
  
 @userPermissions(permissions:[{
        userRole: "admin"
        operations: ["${ADD}", "${SINGULAR}"]
        appName: "appTwo" 
  }, {
        userRole: "admin"
        appName: "student"
        operations: "*"
  },
  {
    userRole: "admin"
        appName: "student"
        operations: "*"
  }
  ], rule: allow) 
  
  
  @allowedOperations(list:["${ADD}", "${SINGULAR}", "${META_QUERY}", "${UPDATE}"])
  {
    order: Int! 
    title: String! 
           @unique 
           @length(min: 6, max: 120) 
           @trim
           @appPermissions(permissions: "*", rule: deny)
    description: String 
           @uniqueOrEmpty 
           @unique @length(min: 6, max: 120) 
           @trim
             @appPermissions(permissions:[{
        appName: "tekieTms"
        operations: ["${ADD}", "${SINGULAR}"]
  }, {
        appName: "appTwo"
        operations: ["${ADD}", "${SINGULAR}"]
  },  
  {
        appName: "three"
        operations: "*"
  },
    {
        appName: "four"
        operations: "*"
  }
  ], rule: allow)
  
 @userPermissions(permissions:[{
        userRole: "admin"
        operations: ["${ADD}", "${SINGULAR}"]
        appName: "appTwo" 
  }, {
        userRole: "admin"
        appName: "student"
        operations: "*"
  },
  {
    userRole: "admin"
        appName: "student"
        operations: "*"
  }
  ], rule: allow) 
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

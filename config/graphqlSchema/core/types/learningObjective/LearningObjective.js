import { ADD, META_QUERY, SINGULAR, UPDATE } from '../../../../../constants/graphqlOperations';

const LearningObjective = `
  type LearningObjective @model 
  @allowedApps(list:[{
        name: "tekieTms"
        allowedOperations: ["${ADD}", "${SINGULAR}"]
  }, {
        name: "appTwo"
        allowedOperations: ["${ADD}", "${SINGULAR}"]
  },
  {
        name: "three"
  }
  ])
  
 @allowedUsers(list:[{
        name: "admin"
        allowedOperations: ["${ADD}", "${SINGULAR}"]
  }, {
        name: "student"
        allowedOperations: ["${ADD}", "${SINGULAR}"]
  },
  {
        name: "three"
  }
  ]) 
  @allowedOperations(list:["${ADD}", "${SINGULAR}", "${META_QUERY}", "${UPDATE}"])
  {
    order: Int! 
             @allowedApps(list:[{
                    name: "tekieTms1"
                    allowedOperations: ["${ADD}", "${SINGULAR}"]
              }, {
                    name: "appTwo1"
                    allowedOperations: ["${ADD}", "${SINGULAR}"]
              },
              {
                    name: "three1"
              }])
            @allowedUsers(list:[{
                    name: "admin1"
                    allowedOperations: ["${ADD}", "${SINGULAR}"]
              }, {
                    name: "student1"
                    allowedOperations: ["${ADD}", "${SINGULAR}"]
              },
              {
                    name: "three1"
              }
              ]) 
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

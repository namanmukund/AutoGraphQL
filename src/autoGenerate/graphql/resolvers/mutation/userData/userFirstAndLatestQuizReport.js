import { get } from 'lodash';
import {
  learningObjectiveQuizReportThreshHolds,
  learningObjectiveRecommendationTexts,
  masteryLevels,
  topicTypes,
  OLD_COURSE_ID,
} from '../../../../../../constants';
import {
  ComponentLockedError,
  DatabaseRecordNotFoundError, UnauthenticatedUserError,
} from '../../../../../../constants/errors';
import getUserIdandAppNameAfterValidation
from '../../../preHookFunctions/validation/utils/getUserIdandAppNameAfterValidation';
import validateCurrentTopicComponent from '../../utils/validateCurrentTopicComponent';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { QueryController } from '../../../controllers';

// query to get current component status of user
// const getUserCurrentTopicComponentStatus = (userId, courseId) => `
//   query{
//     userCurrentTopicComponentStatuses(filter:{
//       and:[
//         {user_some:{
//         id:"${userId}"
//         }},
//       {currentCourse_some:{
//         and:[
//           ${courseId ? `{id: "${courseId}"},` : `{title: "${GLOBAL_COURSE_TITLE}"},`}
//         ]
//       }}
//       ]
//     }){
//       id
//       currentTopic{
//         id
//         order
//       }
//       currentLearningObjective{
//         id
//         order
//       }
//       currentTopicComponentType
//       enrollmentType
//     }
//   }
//   `;

const getUserCurrentTopicComponentStatusAggregation = (userId, courseId) => [
  {
    $project: {
      id: 1,
      currentTopicComponentType: 1,
      enrollmentType: 1,
      currentLearningObjective: 1,
      currentCourse: 1,
      currentTopic: 1,
      user: 1,
    },
  },
  {
    $match: {
      'user.typeId': userId,
      'currentCourse.typeId': courseId || OLD_COURSE_ID,
    },
  }, {
    $lookup: {
      from: 'Topic',
      let: {
        currentTopicId: '$currentTopic.typeId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: [
                '$id',
                '$$currentTopicId',
              ],
            },
          },
        },
        {
          $project: {
            id: 1,
            order: 1,
          },
        },
      ],
      as: 'currentTopic',
    },
  }, {
    $project: {
      id: 1,
      currentTopicComponentType: 1,
      enrollmentType: 1,
      currentLearningObjective: 1,
      currentTopic: {
        $arrayElemAt: [
          '$currentTopic',
          0,
        ],
      },
    },
  }];
// query to get topic and it's order
// const getTopicQuery = (topicId) => `
//   query{
//     topic(id:"${topicId}"){
//       id
//       order
//       title
//     }
//   }
//   `;

const TOPIC_AGGREGATION = (topicId) => [
  {
    $match: {
      id: topicId,
    },
  },
  {
    $project: {
      id: 1,
      order: 1,
      title: 1,
    },
  },
];

// query to get user quiz to get next component
const userQuizQuery = (userId, topicId) => `
  query{
    userQuizs(
      filter: {
        and: [
          { user_some: { id: "${userId}" } }
          { topic_some: { id: "${topicId}" } }
        ]
      }
      orderBy: createdAt_DESC
      first: 1
    ){
      id
      nextComponent {
        topic {
            id
        }
      }
    }
  }
  `;

// query to get user quiz report of a topic
// const getQuizReportQuery = (userId, topicId) => `
//   query{
//     userQuizReports(
//       filter:{
//       and:[
//         {
//           user_some:{
//             id: "${userId}"
//           }
//         },
//         {
//           topic_some:{
//             id:"${topicId}"
//           }
//         }
//       ]
//     }
//     orderBy: createdAt_DESC
//     ){
//       id
//       quizReport {
//         totalQuestionCount
//         correctQuestionCount
//         inCorrectQuestionCount
//         unansweredQuestionCount
//         masteryLevel
//       }
//       learningObjectiveReport {
//         learningObjective {
//           id
//           order
//           title
//         }
//         totalQuestionCount
//         correctQuestionCount
//         inCorrectQuestionCount
//         unansweredQuestionCount
//       }
//     }
//   }
//   `;

const getUserQuizAggregation = (userId, topicId) => [
  {
    $match: {
      'user.typeId': userId,
      'topic.typeId': topicId,
    },
  },
  {
    $project: {
      id: 1,
      createdAt: 1,
      quizReport: {
        totalQuestionCount: 1,
        correctQuestionCount: 1,
        inCorrectQuestionCount: 1,
        unansweredQuestionCount: 1,
        masteryLevel: 1,
      },
      learningObjectiveReport: {
        learningObjective: 1,
        totalQuestionCount: 1,
        correctQuestionCount: 1,
        inCorrectQuestionCount: 1,
        unansweredQuestionCount: 1,
      },
    },
  },
  {
    $sort: {
      createdAt: -1,
    },
  },
];

// query to get batch status
// const getBatchStatus = (userId) => `
//   query{
//     user(id: "${userId}"){
//       studentProfile{
//         batch{
//           id
//           type
//           currentComponent{
//             currentCourse{
//               id
//               order
//             }
//             currentTopic{
//               id
//               order
//             }
//             latestSessionStatus
//           }
//         }
//       }
//     }
//   }
//   `;

const getUserBatchDetails = (userId) => [
  {
    $project: {
      id: 1,
      batch: 1,
      user: 1,
    },
  },
  {
    $match: {
      'user.typeId': userId,
    },
  },
  {
    $lookup: {
      from: 'Batch',
      let: { batchId: '$batch.typeId' },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$id', '$$batchId'],
            },
          },
        },
        {
          $project: {
            id: 1,
            currentComponent: 1,
          },
        },
        {
          $lookup: {
            from: 'BatchCurrentComponentStatus',
            let: {
              ccId: '$currentComponent.typeId',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [
                      '$id',
                      '$$ccId',
                    ],
                  },
                },
              },
              {
                $project: {
                  latestSessionStatus: 1,
                  currentCourse: {
                    id: '$currentCourse.typeId',
                  },
                  currentTopic: 1,
                },
              },
              {
                $lookup: {
                  from: 'Topic',
                  let: {
                    currentTopicId: '$currentTopic.typeId',
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: [
                            '$id',
                            '$$currentTopicId',
                          ],
                        },
                      },
                    },
                    {
                      $project: {
                        id: 1,
                        order: 1,
                      },
                    },
                  ],
                  as: 'currentTopic',
                },
              },
              {
                $project: {
                  currentCourse: 1,
                  currentTopic: {
                    $arrayElemAt: [
                      '$currentTopic',
                      0,
                    ],
                  },
                  latestSessionStatus: 1,
                },
              },
            ],
            as: 'currentComponent',
          },
        },
        {
          $project: {
            id: 1,
            currentComponent: {
              $arrayElemAt: ['$currentComponent', 0],
            },
          },
        },
      ],
      as: 'batch',
    },
  },
  {
    $project: {
      _id: 0,
      id: 1,
      batch: {
        $arrayElemAt: ['$batch', 0],
      },
    },
  },
];

/*
  parsing data of user quiz report so that the logic implemented ahead can read data in
  desired format and return the same.
  Example: suppose client has asked for title and order of topic,
  In that case he will get title and order only. And this is happening when we parse
  data as below. If parsing is not done, it is returning empty data.
  Also evaluating recommendation text on basis of correct/total ques percentage for LO
  */
const parseQuizReport = async (
  quizReport,
) => {
  const {
    familiar: familiarPercentage,
    master: masterPercentage,
    proficient: proficientPercentage,
  } = learningObjectiveQuizReportThreshHolds;
  const {
    learningObjectiveDefaultText,
    learningObjectiveFamiliarText,
    learningObjectiveMasterText,
    learningObjectiveProficientText,
  } = learningObjectiveRecommendationTexts;
  const {
    familiar, master, proficient, defaultMastery,
  } = masteryLevels;
  if (quizReport.learningObjectiveReport
    && quizReport.learningObjectiveReport.length) {
    quizReport.learningObjectiveReport.forEach((loReport, index) => {
      let loRecommendationText = '';
      let masteryLevelText = '';
      let percentage = 0;
      Object.assign(quizReport.learningObjectiveReport[index].learningObjective, { type: 'LearningObjective', typeId: `${loReport.learningObjective.typeId}` });
      if (loReport.totalQuestionCount > 0) {
        percentage = (loReport.correctQuestionCount / loReport.totalQuestionCount) * 100;
      }
      if (percentage === proficientPercentage) {
        loRecommendationText = learningObjectiveProficientText;
        masteryLevelText = proficient;
      } else if (percentage >= masterPercentage) {
        loRecommendationText = learningObjectiveMasterText;
        masteryLevelText = master;
      } else if (percentage < masterPercentage && percentage >= familiarPercentage) {
        loRecommendationText = learningObjectiveFamiliarText;
        masteryLevelText = familiar;
      } else {
        loRecommendationText = learningObjectiveDefaultText;
        masteryLevelText = defaultMastery;
      }
      Object.assign(quizReport.learningObjectiveReport[index],
        {
          recommendationText: loRecommendationText,
          masteryLevel: masteryLevelText,
        });
    });
  }
  if (quizReport.id) {
    Object.assign(quizReport, {
      quizReportId: quizReport.id,
    });
  }
  return quizReport;
};

/*
This is called when user tries goes to quiz report page
It will return the first and last quiz report of the user
based on User current topic component status which will be used to check
whether user has attempted quiz or not
*/
const userFirstAndLatestQuizReportMutationResolver = async (
  root,
  input,
  typeName,
  info,
  mutationName,
  ast,
  context,
  params,
) => {
  /*
  Calling method to validate token and return userId.
  */
  let { userIds } = params;
  let userReceivedFromContext = false;
  if (!userIds || !userIds.length) {
    const userAndAppInfo = getUserIdandAppNameAfterValidation(context, true);
    const {
      userIdFromContext,
    } = userAndAppInfo;
    userIds = [userIdFromContext];
    userReceivedFromContext = true;
  }
  const { topicId, courseId } = params;
  if (!topicId) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'topicId is not present',
      },
    });
  }

  const allUserReports = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const userId of userIds) {
    if (!userId) {
      if (userReceivedFromContext) {
        throw new UnauthenticatedUserError();
      } else {
        /* eslint no-continue:0 */
        continue;
      }
    }

    // checking if user belongs to a batch if he does everthing will be calculated on basis of batch
    /* eslint no-await-in-loop:0 */
    const studentProfileModel = new QueryController('StudentProfile', { bypass: true });
    const batchRes = await studentProfileModel.aggregate(getUserBatchDetails(userId));
    // const batchRes = await callLocalGraphqlApi(
    //   getBatchStatus(userId),
    //   context,
    //   '',
    // );

    const batchCurrentComponentInfo = get(batchRes, '0.batch.currentComponent');
    /* eslint no-await-in-loop:0 */
    // const res = await callLocalGraphqlApi(
    //   getUserCurrentTopicComponentStatus(userId, courseId),
    //   context,
    //   '',
    // );
    const userCurrentTopicCompModel = new QueryController('UserCurrentTopicComponentStatus', { bypass: true });
    const res = await userCurrentTopicCompModel.aggregate(getUserCurrentTopicComponentStatusAggregation(userId, courseId));
    const currentTopicComponentInfo = res[0];

    if (userReceivedFromContext) {
      // calling method to validate user current topic component status
      validateCurrentTopicComponent(currentTopicComponentInfo, mutationName);
    } else {
      if (!currentTopicComponentInfo) {
        /* eslint no-continue:0 */
        continue;
      }
    }

    // calling API to get data of fetched topic
    /* eslint no-await-in-loop:0 */
    const topicModel = new QueryController('Topic', { bypass: true });
    // const topicRes = await callLocalGraphqlApi(
    //   getTopicQuery(topicId),
    //   context,
    //   '',
    // );
    const topicRes = await topicModel.aggregate(TOPIC_AGGREGATION(topicId));
    // getting info of called topic
    const topicInfo = topicRes[0];
    if (!topicInfo) {
      if (userReceivedFromContext) {
        throw new DatabaseRecordNotFoundError({
          data: {
            error: 'Topic is not present',
          },
        });
      } else {
        /* eslint no-continue:0 */
        continue;
      }
    }
    let currentRunningTopic;
    // let currentRunningTopicComponentType;

    // if user belongs to a batch, quiz report will be calculated on basis of batchCurrentComponentStatus
    if (batchCurrentComponentInfo) {
      currentRunningTopic = batchCurrentComponentInfo && batchCurrentComponentInfo.currentTopic;
    } else {
      currentRunningTopic = currentTopicComponentInfo && currentTopicComponentInfo.currentTopic;
      // currentRunningTopicComponentType = currentTopicComponentInfo && currentTopicComponentInfo.currentTopicComponentType;
    }
    if (!courseId || courseId === OLD_COURSE_ID) {
      /* eslint no-lonely-if:0 */
      if (topicInfo.order >= currentRunningTopic.order) {
        if (userReceivedFromContext) {
          throw new ComponentLockedError();
        } else {
          /* eslint no-continue:0 */
          continue;
        }
      }
    } else {
      /* eslint no-lonely-if:0 */
      if (topicInfo.order > currentRunningTopic.order) {
        if (userReceivedFromContext) {
          throw new ComponentLockedError();
        } else {
          /* eslint no-continue:0 */
          continue;
        }
      }
    }
    // else {
    //   if (topicInfo.order > currentRunningTopic.order) {
    //     throw new ComponentLockedError();
    //   } else if (topicInfo.order === currentRunningTopic.order) {
    //     if (!batchCurrentComponentInfo && currentRunningTopicComponentType !== 'quiz') {
    //       throw new ComponentLockedError();
    //     }
    //   }
    // }
    // If not equal then check if not quiz and throw eror ( allow for batch )
    // this object will be returned in output
    const userQuizReportData = {};
    let parsedLatestQuizReport;
    let parsedFirstQuizReport;
    /* eslint no-await-in-loop:0 */
    // const quizRes = await callLocalGraphqlApi(
    //   getQuizReportQuery(userId, topicId),
    //   context,
    //   '',
    // );
    const quizModel = new QueryController('UserQuizReport', { bypass: true });
    const quizInfo = await quizModel.aggregate(getUserQuizAggregation(userId, topicId));
    // Constructing data for first and latest quiz report
    if (quizInfo.length) {
      const latestQuizReport = quizInfo[0];
      parsedLatestQuizReport = parseQuizReport(latestQuizReport);
      parsedLatestQuizReport.quizReportNumber = 'latest';
      if (quizInfo.length > 1) {
        const firstQuizReport = quizInfo[quizInfo.length - 1];
        parsedFirstQuizReport = parseQuizReport(firstQuizReport);
        parsedFirstQuizReport.quizReportNumber = 'first';
      }
    }
    /*
    We are getting latest user quiz through this query.
    Then we will get next published topic
    */
    let nextComponentData = {};
    if (!courseId || courseId === OLD_COURSE_ID) {
      /* eslint no-await-in-loop:0 */
      const userQuizQueryRes = await callLocalGraphqlApi(userQuizQuery(userId, topicId));
      const nextTopicId = get(userQuizQueryRes, 'data.userQuizs[0].nextComponent.topic.id');

      const { video } = topicTypes;
      // parsing data for next topic
      const nextTopicData = { type: 'Topic', typeId: `${nextTopicId}` };
      nextComponentData = {
        topic: nextTopicData,
        nextComponentType: video,
      };
    }
    // parsing data for topic
    const topicData = { type: 'Topic', typeId: `${topicInfo.id}` };
    // parsing data for user
    const userData = { type: 'User', typeId: `${userId}` };

    // Constructing data as per schema
    Object.assign(userQuizReportData, {
      topic: topicData,
      user: userData,
      firstQuizReport: parsedFirstQuizReport,
      latestQuizReport: parsedLatestQuizReport,
      nextComponent: nextComponentData,
    });
    allUserReports.push(userQuizReportData);
  }

  if (userReceivedFromContext) return allUserReports[0];
  return allUserReports;
};

export default userFirstAndLatestQuizReportMutationResolver;

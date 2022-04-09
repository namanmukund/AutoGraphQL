/* eslint-disable arrow-body-style */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unreachable */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable no-plusplus */
import { get } from 'lodash';
import { ifAuthorized } from '../../../../../../utils';
import { QueryController } from '../../../controllers';
import {
  InvalidLearningObjectiveComponent,
  UnauthorizedOperationError,
  PracticeQuestionsNotFound,
} from '../../../../../../constants/errors';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';

const getBatchSessionAggregation = ({ batchId, topicId }) =>
  [{
    $match: {
      'batch.typeId': batchId,
      'topic.typeId': topicId,
    },
  }, {
    $lookup: {
      from: 'Batch',
      let: {
        batchId: '$batch.typeId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: [
                '$id',
                '$$batchId',
              ],
            },
          },
        },
        {
          $lookup: {
            from: 'StudentProfile',
            let: {
              studentId: '$students.typeId',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: [
                      '$id',
                      '$$studentId',
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: 'User',
                  let: {
                    userId: '$user.typeId',
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: [
                            '$id',
                            '$$userId',
                          ],
                        },
                      },
                    },
                    {
                      $project: {
                        id: 1,
                      },
                    },
                  ],
                  as: 'user',
                },
              },
              {
                $project: {
                  id: 1,
                  user: {
                    $arrayElemAt: [
                      '$user',
                      0,
                    ],
                  },
                },
              },
            ],
            as: 'students',
          },
        },
        {
          $project: {
            id: 1,
            students: 1,
          },
        },
      ],
      as: 'batch',
    },
  }, {
    $project: {
      id: 1,
      batch: {
        $arrayElemAt: [
          '$batch',
          0,
        ],
      },
    },
  },
  ];

const getLearningSlideAggregation = ({
  learningSlideId,
}) => [{
  $match: {
    id: learningSlideId,
  },
}, {
  $project: {
    id: 1,
    practiceQuestions: 1,
    learningObjectives: 1,
  },
}];

const getLearningObjectiveAggregation = ({
  learningObjectiveId,
}) => [{
  $match: {
    id: learningObjectiveId,
  },
}, {
  $project: {
    id: 1,
    learningSlides: {
      $ifNull: ['$learningSlides', []],
    },
    questionBank: 1,
  },
}, {
  $lookup: {
    from: 'LearningSlide',
    let: {
      learningSlideId: '$learningSlides.typeId',
    },
    pipeline: [
      {
        $match: {
          $expr: {
            $in: [
              '$id',
              '$$learningSlideId',
            ],
          },
        },
      },
      {
        $project: {
          id: 1,
          practiceQuestions: 1,
        },
      },
    ],
    as: 'learningSlides',
  },
}, {
  $lookup: {
    from: 'QuestionBank',
    let: {
      questionBankId: '$questionBank.typeId',
    },
    pipeline: [{
      $match: {
        $expr: {
          $in: ['$id', '$$questionBankId'],
        },
        status: 'published',
      },
    }, {
      $project: {
        id: 1,
        status: 1,
      },
    }],
    as: 'questionBank',
  },
}];

const getUserPracticeQuestionReportAggregation = ({
  userId,
  loId,
}) => [{
  $match: {
    'learningObjective.typeId': loId,
    'user.typeId': userId,
  },
}, {
  $project: {
    firstTryCount: 1,
    secondTryCount: 1,
    threeOrMoreTryCount: 1,
    helpUsedCount: 1,
    answerUsedCount: 1,
    id: 1,
    detailedReport: 1,
  },
}, {
  $sort: {
    createdAt: -1,
  },
}];

const getTypeQueryController = (
  typeName,
  authentication = {
    bypass: true,
  },
) => new QueryController(typeName, authentication);

const withFallbackValue = (value) => {
  if (value === 'NaN') {
    return 0;
  }
  return value;
};

const transformMongoResults = (obj) => {
  if (obj.studentsCount === 0) {
    return {
      practiceQuestionOverallReport: {
        submittedPercentage: 0,
        attemptedPercentage: 0,
        unattemptedPercentage: 0,
        firstTryPercentage: 0,
        secondTryPercentage: 0,
        thirdTryPercentage: 0,
        avgTriesPerQuestion: 0,
        avgTimePerQuestion: null,
      },
    };
  }
  const finalResult = {
    practiceQuestionOverallReport: {
      submittedPercentage: withFallbackValue(obj.questionsCount === 0 ? 0 : ((obj.submittedCountSum * 100) / obj.studentsCount).toFixed(2)),
      attemptedPercentage: withFallbackValue(obj.questionsCount === 0 ? 0 : ((obj.attemptedCountSum * 100) / obj.studentsCount).toFixed(2)),
      unattemptedPercentage: withFallbackValue(obj.questionsCount === 0 ? 0 : ((obj.unattemptedCountSum * 100) / obj.studentsCount).toFixed(2)),
      firstTryPercentage: withFallbackValue(obj.questionsCount === 0 ? 0 : ((obj.firstTryCountSum * 100) / (obj.submittedCountSum * obj.questionsCount)).toFixed(2)),
      secondTryPercentage: withFallbackValue(obj.questionsCount === 0 ? 0 : ((obj.secondTryCountSum * 100) / (obj.submittedCountSum * obj.questionsCount)).toFixed(2)),
      thirdTryPercentage: withFallbackValue(obj.questionsCount === 0 ? 0 : ((obj.thirdTryCountSum * 100) / (obj.submittedCountSum * obj.questionsCount)).toFixed(2)),
      avgTriesPerQuestion: withFallbackValue(obj.questionsCount === 0 ? 0 : ((obj.firstTryCountSum + (2 * obj.secondTryCountSum) + (3 * obj.thirdTryCountSum)) / (obj.submittedCountSum * obj.questionsCount)).toFixed(2)),
      avgTimePerQuestion: null,
    },
  };
  finalResult.pqIndividualQuestionReport = Array.from(obj.questions.entries(), ([k, v]) => {
    return {
      questionId: k,
      firstTryPercentage: withFallbackValue(obj.questionsCount === 0 ? 0 : ((get(v, 'firstTryCountSum') * 100) / obj.submittedCountSum).toFixed(2)),
      secondTryPercentage: withFallbackValue(obj.questionsCount === 0 ? 0 : ((get(v, 'secondTryCountSum') * 100) / obj.submittedCountSum).toFixed(2)),
      thirdTryPercentage: withFallbackValue(obj.questionsCount === 0 ? 0 : ((get(v, 'thirdTryCountSum') * 100) / obj.submittedCountSum).toFixed(2)),
      avgTries: withFallbackValue(obj.questionsCount === 0 ? 0 : ((get(v, 'firstTryCountSum') + (2 * get(v, 'secondTryCountSum')) + (3 * get(v, 'thirdTryCountSum'))) / (obj.submittedCountSum)).toFixed(2)),
    };
  });
  return finalResult;
};

const practiceQuestionReport = (async (root, params, context) => {
  const authentication = ifAuthorized(context);

  if (!(authentication && authentication.app && authentication.user)) {
    throw new UnauthorizedOperationError();
  }

  // return {
  //   practiceQuestionOverallReport: {
  //     submittedPercentage: 80,
  //     attemptedPercentage: 5,
  //     unattemptedPercentage: 15,
  //     firstTryPercentage: 30,
  //     secondTryPercentage: 45,
  //     thirdTryPercentage: 25,
  //     avgTriesPerQuestion: 2.3,
  //     avgTimePerQuestion: 2,
  //   },
  //   pqIndividualQuestionReport: [{
  //     questionId: null,
  //     firstTryPercentage: 20,
  //     secondTryPercentage: 25,
  //     thirdTryPercentage: 55,
  //     avgTries: 1.2,
  //   }],
  // };

  /**
   * Validation Steps:
   * * Get batch students
   * * If loComponent is learning slide and learning slide id is passed
   *   * check if learning slide has pq in it
   *   * then loop through userPracticeQuestionReport and calculate required data
   * * if loComponent is practiceQuestion and learning objective id is passed
   *   * directly get userPracticeQuestionReport for all users and calculate
   * * if loComponent is learningSlide and learning objectice id is passed
   *   * check if lerning object has learning slide in it and that has pq in it
   *   * if yes then get userPracticeQuestionReport for all users and calculate
   * * if individual userId is passed, directly get userPrcaticeQuestionReport
   *
   * Assumptions:
   * (1) learning objective is connected to only one learning slide
   * (2) learning slide is connected to only one learning objective
   */

  const {
    batchId,
    topicId,
    learningObjectiveId,
    learningSlideId,
    learningObjectiveComponent,
    userId,
  } = params;

  if (!((batchId && topicId) || userId)) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'Topic Id or Batch Id or User Id is missing in input.',
      },
    });
  }

  const batchSessionModel = getTypeQueryController(
    'BatchSession',
    authentication,
  );

  const learningObjectiveModel = getTypeQueryController(
    'LearningObjective',
    authentication,
  );

  const learningSlideModel = getTypeQueryController(
    'LearningSlide',
    authentication,
  );

  const userPracticeQuestionReportModel = getTypeQueryController(
    'UserPracticeQuestionReport',
    authentication,
  );

  let batchSessionRes = null;
  if (batchId && topicId) {
    batchSessionRes = await batchSessionModel.aggregate(
      getBatchSessionAggregation({
        batchId,
        topicId,
      }),
    );

    if (!(batchSessionRes && batchSessionRes.length)) {
      throw new MissingMandatoryInputInRequestError({
        data: {
          message: 'Topic Id or Batch Id passed is incorrect.',
        },
      });
    }
  }

  const students = get(batchSessionRes, '[0].batch.students', []);
  const obj = {
    studentsCount: students.length,
    submittedCountSum: 0,
    attemptedCountSum: 0,
    unattemptedCountSum: 0,
    firstTryCountSum: 0,
    secondTryCountSum: 0,
    thirdTryCountSum: 0,
    avgTriesPerQuestion: 0,
    avgTimePerQuestion: null,
    questions: new Map(),
    questionsCount: 0,
  };

  let learningObjectiveIdFromLearningSlide = null;

  /**
   * Validate input params
   */
  if (learningObjectiveComponent === 'learningSlide') {
    if (learningSlideId) {
      const learningSlideRes = await learningSlideModel.aggregate(
        getLearningSlideAggregation({
          learningSlideId,
        }),
      );
      if (get(learningSlideRes, '[0].practiceQuestions', []).length === 0) {
        throw new PracticeQuestionsNotFound();
      }
      learningObjectiveIdFromLearningSlide = get(learningSlideRes, '[0].learningObjectives[0].typeId');
      obj.questionsCount = get(learningSlideRes, '[0].practiceQuestions', []).length;
    } else if (learningObjectiveId) {
      const learningObjectiveRes = await learningObjectiveModel.aggregate(
        getLearningObjectiveAggregation({
          learningObjectiveId,
        }),
      );
      // if (get(learningObjectiveRes, '[0].learningSlides[0].practiceQuestions', []).length === 0) {
      //   throw new PracticeQuestionsNotFound();
      // }
      obj.questionsCount = get(learningObjectiveRes, '[0].learningSlides[0].practiceQuestions', []).length;
    } else {
      throw new MissingMandatoryInputInRequestError({
        data: {
          message: 'Learning objective Id or Learning slide id not passed in input',
        },
      });
    }
  } else if (learningObjectiveComponent === 'practiceQuestion') {
    if (learningObjectiveId) {
      const learningObjectiveRes = await learningObjectiveModel.aggregate(
        getLearningObjectiveAggregation({
          learningObjectiveId,
        }),
      );
      if (get(learningObjectiveRes, '[0].questionBank', []).length === 0) {
        throw new PracticeQuestionsNotFound();
      }
      obj.questionsCount = get(learningObjectiveRes, '[0].questionBank', []).length;
    } else {
      throw new MissingMandatoryInputInRequestError({
        data: {
          message: 'User id or learning objective Id not passed in input',
        },
      });
    }
  } else {
    throw new InvalidLearningObjectiveComponent();
  }

  /**
  * All students of batch
  */

  for (const student of students) {
    const studentUserId = get(student, 'user.id');
    const loId = learningObjectiveId || learningObjectiveIdFromLearningSlide;
    const userPracticeQuestionReportRes = await userPracticeQuestionReportModel.aggregate(
      getUserPracticeQuestionReportAggregation({
        userId: studentUserId,
        loId,
      }),
    );

    // since multiple userPracticeQuestionReports per user per lo, we get the latest one created

    if (userPracticeQuestionReportRes.length) {
      obj.submittedCountSum += 1;
      obj.firstTryCountSum += get(userPracticeQuestionReportRes, '[0].firstTryCount');
      obj.secondTryCountSum += get(userPracticeQuestionReportRes, '[0].secondTryCount');
      obj.thirdTryCountSum += get(userPracticeQuestionReportRes, '[0].threeOrMoreTryCount');
      obj.questionsCount = get(userPracticeQuestionReportRes, '[0].detailedReport', []).length;
      for (const report of get(userPracticeQuestionReportRes, '[0].detailedReport')) {
        const tempObj = {
          firstTryCount: 0,
          secondTryCount: 0,
          thirdTryCount: 0,
        };
        if (get(report, 'firstTry')) {
          tempObj.firstTryCount += 1;
        } else if (get(report, 'secondTry')) {
          tempObj.secondTryCount += 1;
        } else {
          tempObj.thirdTryCount += 1;
        }
        if (obj.questions.get(get(report, 'question.typeId'))) {
          const newObj = {
            firstTryCountSum: obj.questions.get(get(report, 'question.typeId')).firstTryCountSum + tempObj.firstTryCount,
            secondTryCountSum: obj.questions.get(get(report, 'question.typeId')).secondTryCountSum + tempObj.secondTryCount,
            thirdTryCountSum: obj.questions.get(get(report, 'question.typeId')).thirdTryCountSum + tempObj.thirdTryCount,
          };
          obj.questions.set(get(report, 'question.typeId'), newObj);
        } else {
          obj.questions.set(get(report, 'question.typeId'), {
            firstTryCountSum: tempObj.firstTryCount,
            secondTryCountSum: tempObj.secondTryCount,
            thirdTryCountSum: tempObj.thirdTryCount,
          });
        }
      }
    } else {
      obj.unattemptedCountSum += 1;
    }
  }

  /**
   * Individual Students
   */

  if (userId && learningObjectiveId && !students.length) {
    obj.studentsCount = 1;
    const userPracticeQuestionReportRes = await userPracticeQuestionReportModel.aggregate(
      getUserPracticeQuestionReportAggregation({
        userId,
        loId: learningObjectiveId,
      }),
    );
    if (userPracticeQuestionReportRes.length) {
      obj.submittedCountSum += 1;
      obj.firstTryCountSum += get(userPracticeQuestionReportRes, '[0].firstTryCount');
      obj.secondTryCountSum += get(userPracticeQuestionReportRes, '[0].secondTryCount');
      obj.thirdTryCountSum += get(userPracticeQuestionReportRes, '[0].threeOrMoreTryCount');
      for (const report of get(userPracticeQuestionReportRes, '[0].detailedReport')) {
        const tempObj = {
          firstTryCount: 0,
          secondTryCount: 0,
          thirdTryCount: 0,
        };
        if (get(report, 'firstTry')) {
          tempObj.firstTryCount += 1;
        } else if (get(report, 'secondTry')) {
          tempObj.secondTryCount += 1;
        } else {
          tempObj.thirdTryCount += 1;
        }
        if (obj.questions.get(get(report, 'question.typeId'))) {
          const newObj = {
            firstTryCountSum: obj.questions.get(get(report, 'question.typeId')).firstTryCountSum + tempObj.firstTryCount,
            secondTryCountSum: obj.questions.get(get(report, 'question.typeId')).secondTryCountSum + tempObj.secondTryCount,
            thirdTryCountSum: obj.questions.get(get(report, 'question.typeId')).thirdTryCountSum + tempObj.thirdTryCount,
          };
          obj.questions.set(get(report, 'question.typeId'), newObj);
        } else {
          obj.questions.set(get(report, 'question.typeId'), {
            firstTryCountSum: tempObj.firstTryCount,
            secondTryCountSum: tempObj.secondTryCount,
            thirdTryCountSum: tempObj.thirdTryCount,
          });
        }
      }
    } else {
      obj.unattemptedCountSum += 1;
    }
  }

  /**
   * Transforming aggregation result into required format i.e getPracticeQuestionReportOutput Type
   */
  const transformedClassroomResult = transformMongoResults(
    obj,
  );

  return transformedClassroomResult;
});

export default practiceQuestionReport;

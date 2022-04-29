/* eslint-disable no-lonely-if */
/* eslint-disable arrow-body-style */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unreachable */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable no-plusplus */
import { get } from 'lodash';
import { UnauthorizedOperationError } from '../../../../../../constants/errors';
import { ifAuthorized } from '../../../../../../utils';
import { QueryController } from '../../../controllers';
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

const getMentorMenteeSessionAggregation = ({ userId, topicId }) =>
  [{
    $match: {
      'topic.typeId': topicId,
    },
  }, {
    $lookup: {
      from: 'MenteeSession',
      let: {
        menteeSessionId: '$menteeSession.typeId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: [
                '$id',
                '$$menteeSessionId',
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
      as: 'menteeSession',
    },
  }, {
    $project: {
      id: 1,
      menteeSession: {
        $arrayElemAt: [
          '$menteeSession',
          0,
        ],
      },
      isAssignmentAttempted: 1,
      isAssignmentSubmitted: 1,
      isSubmittedForReview: 1,
      isQuizSubmitted: 1,
      isPracticeSubmitted: 1,
    },
  }, {
    $match: {
      $expr: {
        $eq: [
          '$menteeSession.user.id',
          userId,
        ],
      },
    },
  }];

const getUserQuizReportAggregation = ({ userId, topicId }) =>
  [{
    $match: {
      'user.typeId': userId,
      'topic.typeId': topicId,
    },
  }, {
    $sort: {
      createdAt: -1,
    },
  }, {
    $group: {
      _id: '$latestGroup',
      latest: {
        $first: '$$ROOT',
      },
    },
  }];

const getUserAssignmentAggregation = ({
  userId,
  topicId,
  isHomework,
}) => [{
  $match: {
    'user.typeId': userId,
    'topic.typeId': topicId,
  },
}, {
  $unwind: {
    path: '$assignment',
  },
}, {
  $project: {
    assignmentStatus: 1,
    assignment: {
      isAttempted: 1,
      assignmentQuestion: 1,
      userAnswerCodeSnippet: 1,
      result: 1,
    },
  },
}, {
  $lookup: {
    from: 'AssignmentQuestion',
    let: {
      questionId: '$assignment.assignmentQuestion.typeId',
    },
    pipeline: [
      {
        $match: {
          $expr: {
            $eq: [
              '$id',
              '$$questionId',
            ],
          },
        },
      },
      {
        $project: {
          isHomework: 1,
          id: 1,
        },
      },
    ],
    as: 'assignmentQuestion',
  },
}, {
  $match: {
    'assignmentQuestion.isHomework': isHomework,
  },
}];

const getUserBlockBasedPracticeAggregation = ({
  userId,
  topicId,
  isHomeworkParam,
}) => [{
  $match: {
    'user.typeId': userId,
    'topic.typeId': topicId,
  },
}, {
  $lookup: {
    from: 'BlockBasedProject',
    let: {
      questionId: '$blockBasedPractice.typeId',
    },
    pipeline: [
      {
        $match: {
          $expr: {
            $eq: [
              '$id',
              '$$questionId',
            ],
          },
        },
      },
      {
        $match: {
          isHomework: isHomeworkParam,
        },
      },
    ],
    as: 'blockBasedPractice',
  },
}, {
  $project: {
    blockBasedPractice: {
      $arrayElemAt: [
        '$blockBasedPractice',
        0,
      ],
    },
    result: 1,
  },
}, {
  $match: {
    $expr: {
      $eq: ['$blockBasedPractice.isHomework', isHomeworkParam],
    },
  },
}];

const getTypeQueryController = (
  typeName,
  authentication = {
    bypass: true,
  },
) => new QueryController(typeName, authentication);

const transformMongoResults = (obj) => {
  if (obj.studentsCount === 0) {
    return {
      overall: {
        submittedPercentage: 0,
        attemptedPercentage: 0,
        unattemptedPercentage: 0,
      },
      quiz: null,
      coding: null,
      blockBasedPractice: null,
    };
  }
  const finalResult = {
    overall: {
      submittedPercentage: ((obj.submittedCount * 100) / obj.studentsCount).toFixed(2),
      attemptedPercentage: ((obj.attemptedCount * 100) / obj.studentsCount).toFixed(2),
      unattemptedPercentage: ((obj.unattemptedCount * 100) / obj.studentsCount).toFixed(2),
    },
    quiz: {
      submittedPercentage: obj.quizTotalQuestions === 0 ? 0 : ((obj.quizSubmittedCount * 100) / obj.studentsCount).toFixed(2),
      unattemptedPercentage: obj.quizTotalQuestions === 0 ? 0 : ((obj.quizUnattemptedCount * 100) / obj.studentsCount).toFixed(2),
      totalQuestions: obj.quizTotalQuestions,
      averageScore: (obj.quizTotalQuestions === 0 || obj.quizSubmittedCount === 0) ? 0 : ((obj.quizCorrectSum * 100) / (obj.quizSubmittedCount * obj.quizTotalQuestions)).toFixed(2),
      averageCorrect: (obj.quizTotalQuestions === 0 || obj.quizSubmittedCount === 0) ? 0 : (obj.quizCorrectSum).toFixed(2),
      averageIncorrect: (obj.quizTotalQuestions === 0 || obj.quizSubmittedCount === 0) ? 0 : (obj.quizIncorrectSum).toFixed(2),
      averagePartiallyCorrect: null,
      notEvaluatedCount: null,
      questions: [],
    },
    coding: {
      submittedPercentage: (obj.assignmentTotalQuestions === 0) ? 0 : ((obj.assignmentSubmittedCount * 100) / obj.studentsCount).toFixed(2),
      unattemptedPercentage: (obj.assignmentTotalQuestions === 0) ? 0 : (((obj.assignmentUnattemptedCount * 100) / obj.studentsCount).toFixed(2)),
      totalQuestions: obj.assignmentTotalQuestions,
      averageScore: (obj.assignmentTotalQuestions === 0 || obj.assignmentSubmittedCount === 0) ? 0 : ((obj.assignmentCorrectSum * 100) / (obj.assignmentSubmittedCount * obj.assignmentTotalQuestions)).toFixed(2),
      averageCorrect: (obj.assignmentTotalQuestions === 0 || obj.assignmentSubmittedCount === 0) ? 0 : (obj.assignmentCorrectSum / obj.assignmentSubmittedCount).toFixed(2),
      averageIncorrect: (obj.assignmentTotalQuestions === 0 || obj.assignmentSubmittedCount === 0) ? 0 : (obj.assignmentIncorrectSum / obj.assignmentSubmittedCount).toFixed(2),
      averagePartiallyCorrect: (obj.assignmentTotalQuestions === 0 || obj.assignmentSubmittedCount === 0) ? 0 : (obj.assignmentPartiallyCorrectSum / obj.assignmentSubmittedCount).toFixed(2),
      notEvaluatedCount: (obj.assignmentTotalQuestions === 0 || obj.assignmentSubmittedCount === 0) ? 0 : obj.assignmentUnevaluated / obj.assignmentTotalQuestions,
      questions: [],
    },
    // eslint-disable-next-line no-unused-vars
    blockBasedPractice: Array.from(obj.blockBasedPractice.entries(), ([k, v]) => {
      return {
        blockBasedPracticeTitle: get(v, 'title'),
        submittedPercentage: v.pqTotalQuestions === 0 ? 0 : ((v.pqSubmittedCount * 100) / obj.studentsCount).toFixed(2),
        unattemptedPercentage: v.pqTotalQuestions === 0 ? 0 : ((v.pqUnattemptedCount * 100) / obj.studentsCount).toFixed(2),
        totalQuestions: v.pqTotalQuestions,
        averageScore: (v.pqTotalQuestions === 0 || v.pqSubmittedCount === 0) ? 0 : ((v.pqCorrectSum * 100) / (v.pqSubmittedCount * v.pqTotalQuestions)).toFixed(2),
        averageCorrect: (v.pqTotalQuestions === 0 || v.pqSubmittedCount === 0) ? 0 : (v.pqCorrectSum / v.pqSubmittedCount).toFixed(2),
        averageIncorrect: (v.pqTotalQuestions === 0 || v.pqSubmittedCount === 0) ? 0 : (v.pqIncorrectSum / v.pqSubmittedCount).toFixed(2),
        averagePartiallyCorrect: (v.pqTotalQuestions === 0 || v.pqSubmittedCount === 0) ? 0 : (v.pqPartiallyCorrectSum / v.pqSubmittedCount).toFixed(2),
        notEvaluatedCount: (v.pqTotalQuestions === 0 || v.pqSubmittedCount === 0) ? 0 : v.pqUnevaluated / v.pqTotalQuestions,
        questions: Array.from(v.pqQuestions.entries(), ([key, value]) => {
          return {
            questionId: key,
            percentageCorrect: v.pqSubmittedCount === 0 ? 0 : ((value * 100) / v.pqSubmittedCount).toFixed(2),
          };
        }),
        submissions: Array.from(v.pqSubmissions.values()),
      };
    }),
  };
  finalResult.quiz.questions = Array.from(obj.quizQuestions.entries(), ([k, v]) => {
    return {
      questionId: k,
      percentageCorrect: obj.quizSubmittedCount === 0 ? 0 : ((v * 100) / obj.quizSubmittedCount).toFixed(2),
    };
  });
  finalResult.coding.questions = Array.from(obj.assignmentQuestions.entries(), ([k, v]) => {
    return {
      questionId: k,
      percentageCorrect: obj.assignmentSubmittedCount === 0 ? 0 : ((v * 100) / obj.assignmentSubmittedCount).toFixed(2),
    };
  });

  finalResult.quiz.submissions = Array.from(obj.quizSubmissions.values());
  finalResult.coding.submissions = Array.from(obj.assignmentSubmissions.values());

  return finalResult;
};

const classroomReport = (async (root, params, context) => {
  const authentication = ifAuthorized(context);

  if (!(authentication && authentication.app && authentication.user)) {
    throw new UnauthorizedOperationError();
  }

  const { batchId, topicId, isHomework = false } = params;

  if (!(batchId && topicId)) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'Topic Id or Batch Id is missing in input.',
      },
    });
  }

  const batchSessionModel = getTypeQueryController(
    'BatchSession',
    authentication,
  );

  const mentorMenteeSessionModel = getTypeQueryController(
    'MentorMenteeSession',
    authentication,
  );

  const userQuizReportModel = getTypeQueryController(
    'UserQuizReport',
    authentication,
  );

  const userAssignmentModel = getTypeQueryController(
    'UserAssignment',
    authentication,
  );

  const userBlockBasedPracticeModel = getTypeQueryController(
    'UserBlockBasedPractice',
    authentication,
  );

  const batchSessionRes = await batchSessionModel.aggregate(
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

  const students = get(batchSessionRes, '[0].batch.students');
  const obj = {
    studentsCount: students.length,
    submittedCount: 0,
    attemptedCount: 0,
    unattemptedCount: 0,
    quizTotalQuestions: 0,
    quizCorrectSum: 0,
    quizIncorrectSum: 0,
    quizPartiallyCorrectSum: 0,
    quizSubmittedCount: 0,
    quizUnattemptedCount: 0,
    quizQuestions: new Map(),
    quizSubmissions: new Map(),
    assignmentTotalQuestions: 0,
    assignmentCorrectSum: 0,
    assignmentIncorrectSum: 0,
    assignmentPartiallyCorrectSum: 0,
    assignmentUnevaluated: 0,
    assignmentSubmittedCount: 0,
    assignmentUnattemptedCount: 0,
    assignmentQuestions: new Map(),
    assignmentSubmissions: new Map(),
    blockBasedPractice: new Map(),
  };

  for (const student of students) {
    const userId = get(student, 'user.id');
    const mentorMenteeSessionRes = await mentorMenteeSessionModel.aggregate(
      getMentorMenteeSessionAggregation({
        userId,
        topicId,
      }),
    );
    let userQuizReportRes = [];
    if (isHomework) {
      userQuizReportRes = await userQuizReportModel.aggregate(
        getUserQuizReportAggregation({
          userId,
          topicId,
        }),
      );
    }
    const userAssignmentRes = await userAssignmentModel.aggregate(
      getUserAssignmentAggregation({
        userId,
        topicId,
        isHomework,
      }),
    );
    const userBlockbasedPracticeRes = await userBlockBasedPracticeModel.aggregate(
      getUserBlockBasedPracticeAggregation({
        userId,
        topicId,
        isHomework,
      }),
    );

    let isMmsPresent = false;

    if (mentorMenteeSessionRes.length) {
      isMmsPresent = true;
      const mms = get(mentorMenteeSessionRes, '[0]');
      if (get(mms, 'isSubmittedForReview')) {
        obj.submittedCount += 1;
      } else if (get(mms, 'isQuizSubmitted')
        || get(mms, 'isAssignmentSubmitted')
        || get(mms, 'isPracticeSubmitted')) {
        obj.attemptedCount += 1;
      } else {
        obj.unattemptedCount += 1;
      }
      if (get(mms, 'isQuizSubmitted')) {
        obj.quizSubmittedCount += 1;
      } else {
        obj.quizUnattemptedCount += 1;
      }
      if (get(mms, 'isAssignmentSubmitted')) {
        obj.assignmentSubmittedCount += 1;
        obj.assignmentSubmissions.set(userId, {
          userId,
        });
      } else {
        obj.assignmentUnattemptedCount += 1;
      }
    } else {
      // check if mms is absent
      obj.unattemptedCount += 1;
    }

    if (userQuizReportRes.length && get(userQuizReportRes, '[0].latest')) {
      const userQuizReport = get(userQuizReportRes, '[0].latest');
      obj.quizTotalQuestions = get(userQuizReport, 'quizReport.totalQuestionCount');
      obj.quizCorrectSum += get(userQuizReport, 'quizReport.correctQuestionCount');
      obj.quizIncorrectSum += get(userQuizReport, 'quizReport.inCorrectQuestionCount');
      obj.quizSubmissions.set(userId, {
        userId,
        quizScore: get(userQuizReport, 'quizReport.correctQuestionCount'),
      });
      const quizAnswers = get(userQuizReport, 'quizAnswers', []);
      for (const quizAnswer of quizAnswers) {
        if (obj.quizQuestions.has(get(quizAnswer, 'question.typeId'))) {
          if (get(quizAnswer, 'isCorrect')) {
            obj.quizQuestions.set(get(quizAnswer, 'question.typeId'), obj.quizQuestions.get(get(quizAnswer, 'question.typeId')) + 1);
          }
        } else {
          if (get(quizAnswer, 'isCorrect')) {
            obj.quizQuestions.set(get(quizAnswer, 'question.typeId'), 1);
          } else {
            obj.quizQuestions.set(get(quizAnswer, 'question.typeId'), 0);
          }
        }
      }
    }

    if (userAssignmentRes.length) {
      let isAtleastOneAssignmentSubmitted = false;
      obj.assignmentTotalQuestions = userAssignmentRes.length;
      for (const assignmentQuestion of userAssignmentRes) {
        if (get(assignmentQuestion, 'assignment.result') === 'correct') {
          obj.assignmentCorrectSum += 1;
        } else if (get(assignmentQuestion, 'assignment.result') === 'incorrect') {
          obj.assignmentIncorrectSum += 1;
        } else if (get(assignmentQuestion, 'assignment.result') === 'partiallyCorrect') {
          obj.assignmentPartiallyCorrectSum += 1;
        } else {
          obj.assignmentUnevaluated += 1;
        }
        // individual questions
        if (get(assignmentQuestion, 'assignmentStatus', '') === 'complete') {
          if (obj.assignmentQuestions.has(get(assignmentQuestion, 'assignment.assignmentQuestion.typeId', ''))) {
            if (get(assignmentQuestion, 'assignment.userAnswerCodeSnippet', '').length) {
              obj.assignmentQuestions.set(get(assignmentQuestion, 'assignment.assignmentQuestion.typeId', ''), obj.assignmentQuestions.get(get(assignmentQuestion, 'assignment.assignmentQuestion.typeId', '')) + 1);
            }
          } else {
            if (get(assignmentQuestion, 'assignment.userAnswerCodeSnippet', '').length) {
              obj.assignmentQuestions.set(get(assignmentQuestion, 'assignment.assignmentQuestion.typeId', ''), 1);
              isAtleastOneAssignmentSubmitted = true;
            } else {
              obj.assignmentQuestions.set(get(assignmentQuestion, 'assignment.assignmentQuestion.typeId', ''), 0);
            }
          }
        }
      }
      if (!isMmsPresent && isAtleastOneAssignmentSubmitted) {
        obj.assignmentSubmittedCount += 1;
      }
    }

    for (const userbbPractice of userBlockbasedPracticeRes) {
      const innerObj = {
        title: '',
        pqTotalQuestions: 1,
        pqCorrectSum: 0,
        pqIncorrectSum: 0,
        pqPartiallyCorrectSum: 0,
        pqUnevaluated: 0,
        pqSubmittedCount: 0,
        pqUnattemptedCount: 0,
        pqQuestions: new Map(),
        pqSubmissions: new Map(),
      };
      if (get(userbbPractice, 'blockBasedPractice')) {
        innerObj.pqSubmittedCount += 1;
        innerObj.pqSubmissions.set(userId, {
          userId,
        });
        innerObj.title = get(userbbPractice, 'blockBasedPractice.title', '');
        if (get(userbbPractice, 'result') === 'correct') {
          innerObj.pqCorrectSum += 1;
        } else if (get(userbbPractice, 'result') === 'incorrect') {
          innerObj.pqIncorrectSum += 1;
        } else if (get(userbbPractice, 'result') === 'partiallyCorrect') {
          innerObj.pqPartiallyCorrectSum += 1;
        } else {
          innerObj.pqUnevaluated += 1;
        }
        // individual questions
        if (innerObj.pqQuestions.has(get(userbbPractice, 'blockBasedPractice.id'))) {
          if (get(userbbPractice, 'blockBasedPractice.isSubmitAnswer')) {
            innerObj.pqQuestions.set(get(userbbPractice, 'blockBasedPractice.id'), innerObj.pqQuestions.get(get(userbbPractice, 'blockBasedPractice.id')) + 1);
          }
        } else {
          if (get(userbbPractice, 'blockBasedPractice.isSubmitAnswer')) {
            innerObj.pqQuestions.set(get(userbbPractice, 'blockBasedPractice.id'), 1);
          } else {
            innerObj.pqQuestions.set(get(userbbPractice, 'blockBasedPractice.id'), 0);
          }
        }
      } else {
        innerObj.pqUnattemptedCount += 1;
      }
      obj.blockBasedPractice.set(get(userbbPractice, 'blockBasedPractice.id'), innerObj);
    }
  }

  /**
   * Transforming aggregation result into required format i.e ClassroomSessionResult Type
   */
  const transformedClassroomResult = transformMongoResults(
    obj,
  );

  return transformedClassroomResult;
});

export default classroomReport;

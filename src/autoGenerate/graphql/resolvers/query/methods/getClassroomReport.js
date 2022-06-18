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

const getMentorMenteeSessionAggregation = ({ userIds = [], topicId }) =>
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
          $project: {
            id: 1,
            user: 1,
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
      'menteeSession.user.typeId': {
        $in: userIds,
      },
    },
  }];

const getUserQuizReportAggregation = ({ userIds, topicId }) =>
  [{
    $match: {
      'user.typeId': {
        $in: userIds || [],
      },
      'topic.typeId': topicId,
    },
  }, {
    $sort: {
      createdAt: -1,
    },
  }, {
    $group: {
      _id: '$user.typeId',
      latest: {
        $first: '$$ROOT',
      },
    },
  }];

const getUserAssignmentAggregation = ({
  userIds,
  topicId,
  isHomework,
}) => [{
  $match: {
    'user.typeId': {
      $in: userIds,
    },
    'topic.typeId': topicId,
  },
}, {
  $unwind: {
    path: '$assignment',
  },
}, {
  $project: {
    assignmentStatus: 1,
    user: 1,
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
  userIds,
  topicId,
  isHomeworkParam,
}) => [{
  $match: {
    'user.typeId': {
      $in: userIds,
    },
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
    user: 1,
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
      submittedPercentage: ((obj.submittedCount * 100) / obj.studentsCount).toFixed(),
      attemptedPercentage: ((obj.attemptedCount * 100) / obj.studentsCount).toFixed(),
      unattemptedPercentage: ((obj.unattemptedCount * 100) / obj.studentsCount).toFixed(),
    },
    quiz: {
      submittedPercentage: obj.quizTotalQuestions === 0 ? 0 : ((obj.quizSubmittedCount * 100) / obj.studentsCount).toFixed(),
      unattemptedPercentage: obj.quizTotalQuestions === 0 ? 0 : ((obj.quizUnattemptedCount * 100) / obj.studentsCount).toFixed(),
      totalQuestions: obj.quizTotalQuestions,
      averageScore: (obj.quizTotalQuestions === 0 || obj.quizSubmittedCount === 0) ? 0 : ((obj.quizCorrectSum * 100) / (obj.quizSubmittedCount * obj.quizTotalQuestions)).toFixed(),
      averageCorrect: (obj.quizTotalQuestions === 0 || obj.quizSubmittedCount === 0) ? 0 : (obj.quizCorrectSum).toFixed(),
      averageIncorrect: (obj.quizTotalQuestions === 0 || obj.quizSubmittedCount === 0) ? 0 : (obj.quizIncorrectSum).toFixed(),
      averagePartiallyCorrect: null,
      notEvaluatedCount: null,
      questions: [],
    },
    coding: {
      submittedPercentage: (obj.assignmentTotalQuestions === 0) ? 0 : ((obj.assignmentSubmittedCount * 100) / obj.studentsCount).toFixed(),
      unattemptedPercentage: (obj.assignmentTotalQuestions === 0) ? 0 : (((obj.assignmentUnattemptedCount * 100) / obj.studentsCount).toFixed()),
      totalQuestions: obj.assignmentTotalQuestions,
      averageScore: (obj.assignmentTotalQuestions === 0 || obj.assignmentSubmittedCount === 0) ? 0 : ((obj.assignmentCorrectSum * 100) / (obj.assignmentSubmittedCount * obj.assignmentTotalQuestions)).toFixed(),
      averageCorrect: (obj.assignmentTotalQuestions === 0 || obj.assignmentSubmittedCount === 0) ? 0 : (obj.assignmentCorrectSum / obj.assignmentSubmittedCount).toFixed(),
      averageIncorrect: (obj.assignmentTotalQuestions === 0 || obj.assignmentSubmittedCount === 0) ? 0 : (obj.assignmentIncorrectSum / obj.assignmentSubmittedCount).toFixed(),
      averagePartiallyCorrect: (obj.assignmentTotalQuestions === 0 || obj.assignmentSubmittedCount === 0) ? 0 : (obj.assignmentPartiallyCorrectSum / obj.assignmentSubmittedCount).toFixed(),
      notEvaluatedCount: (obj.assignmentTotalQuestions === 0 || obj.assignmentSubmittedCount === 0) ? 0 : obj.assignmentUnevaluated / obj.assignmentTotalQuestions,
      questions: [],
    },
    // eslint-disable-next-line no-unused-vars
    blockBasedPractice: Array.from(obj.blockBasedPractice.entries(), ([k, v]) => {
      return {
        blockBasedPracticeTitle: get(v, 'title'),
        submittedPercentage: v.pqTotalQuestions === 0 ? 0 : ((v.pqSubmittedCount * 100) / obj.studentsCount).toFixed(),
        unattemptedPercentage: v.pqTotalQuestions === 0 ? 0 : ((v.pqUnattemptedCount * 100) / obj.studentsCount).toFixed(),
        totalQuestions: v.pqTotalQuestions,
        averageScore: (v.pqTotalQuestions === 0 || v.pqSubmittedCount === 0) ? 0 : ((v.pqCorrectSum * 100) / (v.pqSubmittedCount * v.pqTotalQuestions)).toFixed(),
        averageCorrect: (v.pqTotalQuestions === 0 || v.pqSubmittedCount === 0) ? 0 : (v.pqCorrectSum / v.pqSubmittedCount).toFixed(),
        averageIncorrect: (v.pqTotalQuestions === 0 || v.pqSubmittedCount === 0) ? 0 : (v.pqIncorrectSum / v.pqSubmittedCount).toFixed(),
        averagePartiallyCorrect: (v.pqTotalQuestions === 0 || v.pqSubmittedCount === 0) ? 0 : (v.pqPartiallyCorrectSum / v.pqSubmittedCount).toFixed(),
        notEvaluatedCount: (v.pqTotalQuestions === 0 || v.pqSubmittedCount === 0) ? 0 : v.pqUnevaluated / v.pqTotalQuestions,
        questions: Array.from(v.pqQuestions.entries(), ([key, value]) => {
          return {
            questionId: key,
            percentageCorrect: v.pqSubmittedCount === 0 ? 0 : ((value * 100) / v.pqSubmittedCount).toFixed(),
          };
        }),
        submissions: Array.from(v.pqSubmissions.values()),
      };
    }),
  };
  finalResult.quiz.questions = Array.from(obj.quizQuestions.entries(), ([k, v]) => {
    return {
      questionId: k,
      percentageCorrect: obj.quizSubmittedCount === 0 ? 0 : ((get(v, 'correct', 0) * 100) / obj.quizSubmittedCount).toFixed(),
      percentageIncorrect: obj.quizSubmittedCount === 0 ? 0 : ((get(v, 'incorrect', 0) * 100) / obj.quizSubmittedCount).toFixed(),
      percentageUnattempted: obj.quizSubmittedCount === 0 ? 0 : ((get(v, 'unattempted', 0) * 100) / obj.quizSubmittedCount).toFixed(),
      submissionsCount: obj.quizSubmittedCount,
    };
  });
  finalResult.coding.questions = Array.from(obj.assignmentQuestions.entries(), ([k, v]) => {
    return {
      questionId: k,
      percentageCorrect: obj.assignmentSubmittedCount === 0 ? 0 : ((v * 100) / obj.studentsCount).toFixed(),
    };
  });
  finalResult.quiz.learningObjectiveReport = Array.from(obj.quizLearningObjectiveReport.entries(), ([k, v]) => {
    return {
      questionId: k,
      percentageCorrect: ((get(v, 'correctQuestionCount', 0) * 100) / get(v, 'totalQuestionCount', 1)),
      title: (get(v, 'learningObjective.title', '')),
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
    quizLearningObjectiveReport: new Map(),
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

  const userIds = (students || []).map((student) => get(student, 'user.id'));
  let mentorMenteeSessionsRes = [];
  let usersAssignmentRes = [];
  let usersQuizReportRes = [];
  let usersBlockbasedPracticeRes = [];
  if (userIds && userIds.length) {
    mentorMenteeSessionsRes = await mentorMenteeSessionModel.aggregate(
      getMentorMenteeSessionAggregation({
        userIds,
        topicId,
      }),
    );
    if (isHomework) {
      usersQuizReportRes = await userQuizReportModel.aggregate(
        getUserQuizReportAggregation({
          userIds,
          topicId,
        }),
      );
    }
    usersAssignmentRes = await userAssignmentModel.aggregate(
      getUserAssignmentAggregation({
        userIds,
        topicId,
        isHomework,
      }),
    );
    usersBlockbasedPracticeRes = await userBlockBasedPracticeModel.aggregate(
      getUserBlockBasedPracticeAggregation({
        userIds,
        topicId,
        isHomework,
      }),
    );
  }
  for (const student of students) {
    const userId = get(student, 'user.id');
    const mentorMenteeSessionRes = (mentorMenteeSessionsRes || []).filter((mms) => get(mms, 'menteeSession.user.typeId') === userId);
    const userQuizReportRes = (usersQuizReportRes || []).filter((quizReport) => get(quizReport, '_id') === userId);
    const userAssignmentRes = (usersAssignmentRes || []).filter((userAssignment) => get(userAssignment, 'user.typeId') === userId);
    const userBlockbasedPracticeRes = (usersBlockbasedPracticeRes || []).filter((userPractice) => get(userPractice, 'user.typeId') === userId);

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
          if (!get(quizAnswer, 'isAttempted')) {
            obj.quizQuestions.set(get(quizAnswer, 'question.typeId'), {
              ...obj.quizQuestions.get(get(quizAnswer, 'question.typeId')),
              unattempted: get(obj.quizQuestions.get(get(quizAnswer, 'question.typeId')), 'unattempted', 0) + 1,
            });
          } else if (get(quizAnswer, 'isCorrect')) {
            obj.quizQuestions.set(get(quizAnswer, 'question.typeId'), {
              ...obj.quizQuestions.get(get(quizAnswer, 'question.typeId')),
              correct: get(obj.quizQuestions.get(get(quizAnswer, 'question.typeId')), 'correct', 0) + 1,
            });
          } else {
            obj.quizQuestions.set(get(quizAnswer, 'question.typeId'), {
              ...obj.quizQuestions.get(get(quizAnswer, 'question.typeId')),
              incorrect: get(obj.quizQuestions.get(get(quizAnswer, 'question.typeId')), 'incorrect', 0) + 1,
            });
          }
        } else {
          if (!get(quizAnswer, 'isAttempted')) {
            obj.quizQuestions.set(get(quizAnswer, 'question.typeId'), {
              unattempted: 1,
            });
          } else if (get(quizAnswer, 'isCorrect')) {
            obj.quizQuestions.set(get(quizAnswer, 'question.typeId'), {
              correct: 1,
            });
          } else {
            obj.quizQuestions.set(get(quizAnswer, 'question.typeId'), {
              incorrect: 1,
            });
          }
        }
      }
      // for each LO
      for (const loReport of get(userQuizReport, 'learningObjectiveReport', [])) {
        obj.quizLearningObjectiveReport.set(get(loReport, 'learningObjective.typeId'), loReport);
      }
    }

    if (userAssignmentRes.length) {
      let isAtleastOneAssignmentSubmitted = false;
      obj.assignmentTotalQuestions = userAssignmentRes.length;
      let isAssignmentAttemptedAndSubmitted = 0;
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
            if (get(assignmentQuestion, 'assignment.userAnswerCodeSnippet', '') !== 'null' && get(assignmentQuestion, 'assignment.userAnswerCodeSnippet', '')) {
              obj.assignmentQuestions.set(get(assignmentQuestion, 'assignment.assignmentQuestion.typeId', ''), obj.assignmentQuestions.get(get(assignmentQuestion, 'assignment.assignmentQuestion.typeId', '')) + 1);
              isAssignmentAttemptedAndSubmitted += 1;
            }
          } else {
            if (get(assignmentQuestion, 'assignment.userAnswerCodeSnippet', '') !== 'null' && get(assignmentQuestion, 'assignment.userAnswerCodeSnippet', '')) {
              obj.assignmentQuestions.set(get(assignmentQuestion, 'assignment.assignmentQuestion.typeId', ''), 1);
              isAtleastOneAssignmentSubmitted = true;
              isAssignmentAttemptedAndSubmitted += 1;
            } else {
              obj.assignmentQuestions.set(get(assignmentQuestion, 'assignment.assignmentQuestion.typeId', ''), 0);
            }
          }
        }
      }
      if (isAssignmentAttemptedAndSubmitted) {
        obj.assignmentSubmittedCount += 1;
        obj.assignmentSubmissions.set(userId, {
          userId,
        });
      } else {
        obj.assignmentUnattemptedCount += 1;
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

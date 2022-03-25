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
  courseId,
}) => [{
  $match: {
    'user.typeId': userId,
    'topic.typeId': topicId,
    'course.typeId': courseId,
  },
}, {
  $project: {
    assignmentStatus: 1,
    assignment: {
      $arrayElemAt: [
        '$assignment',
        0,
      ],
    },
  },
}, {
  $lookup: {
    from: 'AssignmentQuestion',
    let: {
      assignmentQuestionId: '$assignment.assignmentQuestion.typeId',
    },
    pipeline: [
      {
        $match: {
          $expr: {
            $eq: [
              '$id',
              '$$assignmentQuestionId',
            ],
          },
          isHomework: false,
        },
      },
    ],
    as: 'assignmentQuestion',
  },
}, {
  $project: {
    assignmentStatus: 1,
    assignment: 1,
    assignmentQuestion: {
      $arrayElemAt: [
        '$assignmentQuestion',
        0,
      ],
    },
  },
}];

const getUserBlockBasedPracticeAggregation = ({
  userId,
  topicId,
  courseId,
}) => [{
  $match: {
    'user.typeId': userId,
    'topic.typeId': topicId,
    'course.typeId': courseId,
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
          isHomework: true,
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
  },
}];

const getTypeQueryController = (
  typeName,
  authentication = {
    bypass: true,
  },
) => new QueryController(typeName, authentication);

const transformMongoResults = (obj) => {
  const finalResult = {
    overall: {
      submittedPercentage: ((obj.submittedCount * 100) / obj.studentsCount).toFixed(2),
      attemptedPercentage: ((obj.attemptedCount * 100) / obj.studentsCount).toFixed(2),
      unattemptedPercentage: ((obj.unattemptedCount * 100) / obj.studentsCount).toFixed(2),
    },
    quiz: {
      submittedPercentage: ((obj.quizSubmittedCount * 100) / obj.studentsCount).toFixed(2),
      unattemptedPercentage: (100 - ((obj.quizSubmittedCount * 100) / obj.studentsCount).toFixed(2)).toFixed(2),
      totalQuestions: obj.quizTotalQuestions,
      averageScore: ((obj.quizCorrectSum * 100) / (obj.studentsCount * 10)).toFixed(2),
      averageCorrect: (obj.quizCorrectSum / obj.studentsCount).toFixed(2),
      averageIncorrect: (obj.quizIncorrectSum / obj.studentsCount).toFixed(2),
      averagePartiallyCorrect: null,
      questions: [],
    },
    coding: {
      submittedPercentage: ((obj.assignmentSubmittedCount * 100) / obj.studentsCount).toFixed(2),
      unattemptedPercentage: (100 - ((obj.assignmentSubmittedCount * 100) / obj.studentsCount).toFixed(2)).toFixed(2),
      totalQuestions: obj.assignmentTotalQuestions,
      averageScore: ((obj.assignmentCorrectSum * 100) / (obj.studentsCount * 10)).toFixed(2),
      averageCorrect: (obj.assignmentCorrectSum / obj.studentsCount).toFixed(2),
      averageIncorrect: (obj.assignmentIncorrectSum / obj.studentsCount).toFixed(2),
      averagePartiallyCorrect: (obj.assignmentPartiallyCorrectSum / obj.studentsCount).toFixed(2),
      questions: [],
    },
    pq: {
      submittedPercentage: ((obj.pqSubmittedCount * 100) / obj.studentsCount).toFixed(2),
      unattemptedPercentage: (100 - ((obj.pqSubmittedCount * 100) / obj.studentsCount).toFixed(2)).toFixed(2),
      totalQuestions: obj.pqTotalQuestions,
      averageScore: ((obj.pqCorrectSum * 100) / (obj.studentsCount * 10)).toFixed(2),
      averageCorrect: (obj.pqCorrectSum / obj.studentsCount).toFixed(2),
      averageIncorrect: (obj.pqIncorrectSum / obj.studentsCount).toFixed(2),
      averagePartiallyCorrect: null,
      questions: [],
    },
  };
  finalResult.quiz.questions = Object.entries(obj.quizQuestions).map(([k, v]) => {
    return {
      questionId: k,
      percentageCorrect: ((v * 100) / obj.studentsCount).toFixed(2),
    };
  });
  finalResult.coding.questions = Object.entries(obj.assignmentQuestions).map(([k, v]) => {
    return {
      questionId: k,
      percentageCorrect: ((v * 100) / obj.studentsCount).toFixed(2),
    };
  });
  finalResult.pq.questions = Object.entries(obj.pqQuestions).map(([k, v]) => {
    return {
      questionId: k,
      percentageCorrect: ((v * 100) / obj.studentsCount).toFixed(2),
    };
  });
  return finalResult;
};

const classroomHomeworkReport = (async (root, params, context) => {
  const authentication = ifAuthorized(context);

  if (!(authentication && authentication.app && authentication.user)) {
    throw new UnauthorizedOperationError();
  }

  const { batchId, topicId } = params;

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

  /**
   * Aggregation Queries for batchSession & adhocSessions
   */
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
  const courseId = get(batchSessionRes, '[0].course.typeId');
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
    assignmentTotalQuestions: 0,
    assignmentCorrectSum: 0,
    assignmentIncorrectSum: 0,
    assignmentPartiallyCorrectSum: 0,
    assignmentUnevaluated: 0,
    assignmentSubmittedCount: 0,
    assignmentUnattemptedCount: 0,
    assignmentQuestions: new Map(),
    pqTotalQuestions: 0,
    pqCorrectSum: 0,
    pqIncorrectSum: 0,
    pqPartiallyCorrectSum: 0,
    pqUnevaluated: 0,
    pqSubmittedCount: 0,
    pqUnattemptedCount: 0,
    pqQuestions: new Map(),
  };

  for (const student of students) {
    const userId = get(student, 'user.id');
    const mentorMenteeSessionRes = await mentorMenteeSessionModel.aggregate(
      getMentorMenteeSessionAggregation({
        userId,
        topicId,
      }),
    );
    const userQuizReportRes = await userQuizReportModel.aggregate(
      getUserQuizReportAggregation({
        userId,
        topicId,
      }),
    );
    const userAssignmentRes = await userAssignmentModel.aggregate(
      getUserAssignmentAggregation({
        userId,
        topicId,
        courseId,
      }),
    );
    const userBlockbasedPracticeRes = await userBlockBasedPracticeModel.aggregate(
      getUserBlockBasedPracticeAggregation({
        userId,
        topicId,
        courseId,
      }),
    );

    if (mentorMenteeSessionRes.length) {
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
    }

    if (userQuizReportRes.length) {
      const userQuizReport = get(userQuizReportRes, '[0].latest');
      obj.quizTotalQuestions = get(userQuizReport, 'quizReport.totalQuestionCount');
      obj.quizCorrectSum = get(userQuizReport, 'quizReport.correctQuestionCount');
      obj.quizIncorrectSum = get(userQuizReport, 'quizReport.inCorrectQuestionCount');
      for (const quizAnswer of get(userQuizReport, 'quizAnswers')) {
        if (obj.quizQuestions.has(get(quizAnswer, 'question.typeId'))
          && get(quizAnswer, 'isCorrect')) {
          obj.quizQuestions.set(get(quizAnswer, 'question.typeId'), obj.quizQuestions.get(get(quizAnswer, 'question.typeId')) + 1);
        } else {
          obj.quizQuestions.set(get(quizAnswer, 'question.typeId'), 1);
        }
      }
    }

    if (userAssignmentRes.length) {
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
      }
    }

    if (get(userBlockbasedPracticeRes, 'blockBasedPractice')) {
      obj.pqTotalQuestions = 1;
      if (get(userBlockbasedPracticeRes, 'result') === 'correct') {
        obj.pqCorrectSum += 1;
      } else if (get(userBlockbasedPracticeRes, 'result') === 'incorrect') {
        obj.pqIncorrectSum += 1;
      } else if (get(userBlockbasedPracticeRes, 'result') === 'partiallyCorrect') {
        obj.pqPartiallyCorrectSum += 1;
      } else {
        obj.pqUnevaluated += 1;
      }
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

export default classroomHomeworkReport;

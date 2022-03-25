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
      'user.typeId': {
        $in: [
          userId,
        ],
      },
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
    assignment: 1,
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
    },
    coding: {
      submittedPercentage: ((obj.assignmentSubmittedCount * 100) / obj.studentsCount).toFixed(2),
      unattemptedPercentage: (100 - ((obj.assignmentSubmittedCount * 100) / obj.studentsCount).toFixed(2)).toFixed(2),
      totalQuestions: obj.assignmentTotalQuestions,
      averageScore: ((obj.assignmentCorrectSum * 100) / (obj.studentsCount * 10)).toFixed(2),
      averageCorrect: (obj.assignmentCorrectSum / obj.studentsCount).toFixed(2),
      averageIncorrect: (obj.assignmentIncorrectSum / obj.studentsCount).toFixed(2),
      averagePartiallyCorrect: null,
    },
    pq: {
      submittedPercentage: ((obj.pqSubmittedCount * 100) / obj.studentsCount).toFixed(2),
      unattemptedPercentage: (100 - ((obj.pqSubmittedCount * 100) / obj.studentsCount).toFixed(2)).toFixed(2),
      totalQuestions: obj.pqTotalQuestions,
      averageScore: ((obj.pqCorrectSum * 100) / (obj.studentsCount * 10)).toFixed(2),
      averageCorrect: (obj.pqCorrectSum / obj.studentsCount).toFixed(2),
      averageIncorrect: (obj.pqIncorrectSum / obj.studentsCount).toFixed(2),
      averagePartiallyCorrect: null,
    },
  };
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
    quizSubmittedCount: 0,
    quizUnattemptedCount: 0,
    assignmentTotalQuestions: 0,
    assignmentCorrectSum: 0,
    assignmentIncorrectSum: 0,
    assignmentSubmittedCount: 0,
    assignmentUnattemptedCount: 0,
    pqTotalQuestions: 0,
    pqCorrectSum: 0,
    pqIncorrectSum: 0,
    pqSubmittedCount: 0,
    pqUnattemptedCount: 0,
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
      obj.quizTotalQuestions = userQuizReport.quizReport.totalQuestionCount;
      obj.quizCorrectSum = userQuizReport.quizReport.correctQuestionCount;
      obj.quizIncorrectSum = userQuizReport.quizReport.inCorrectQuestionCount;
    }

    if (userAssignmentRes.length) {
      const userAssignment = get(userAssignmentRes, '[0]');
      obj.assignmentTotalQuestions = get(userAssignment, 'assignment', []).length;
    }

    // TODO : add user block based practice aggregation
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

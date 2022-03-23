/* eslint-disable no-unreachable */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable no-plusplus */
import { isBefore, isToday } from 'date-fns';
import { get, sortBy } from 'lodash';
// import moment from 'moment';
import { slotTimes } from '../../../../../../constants';
import { UnauthorizedOperationError } from '../../../../../../constants/errors';
import { ifAuthorized } from '../../../../../../utils';
import { QueryController } from '../../../controllers';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';

const getSlotTimeFields = (session) => {
  const slotTimeObj = {};
  slotTimes.forEach((slotTime) => {
    if (session) {
      slotTimeObj[`${slotTime}`] = get(session, slotTime, false);
    } else {
      slotTimeObj[`${slotTime}`] = 1;
    }
  });
  return slotTimeObj;
};

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

const getTypeQueryController = (
  typeName,
  authentication = {
    bypass: true,
  },
) => new QueryController(typeName, authentication);

// const constructDocFilters = (filters) => {
//   /**
//    * Example Filters ->
//    *  grades: [ 'Grade1', 'Grade2' ],
//    *  sections: [ 'A', 'B' ],
//    *  courses: [ 'ID1', 'ID2' ],
//    *  sessionStatus: [ 'started', 'completed' ]
//    *  schools: ['ID']
//    */
//   const sessionFilters = {};
//   const classroomFilters = {};
//   if (get(filters, 'grades', []).length) {
//     classroomFilters['classroom.classes.grade'] = {
//       $in: get(filters, 'grades'),
//     };
//   }
//   if (get(filters, 'sections', []).length) {
//     classroomFilters['classroom.classes.section'] = {
//       $in: get(filters, 'sections', []),
//     };
//   }
//   if (get(filters, 'schools', []).length) {
//     classroomFilters['classroom.school.typeId'] = {
//       $in: get(filters, 'schools'),
//     };
//   }
//   if (get(filters, 'sessionStatus', []).length) {
//     sessionFilters.sessionStatus = {
//       $in: get(filters, 'sessionStatus', []).map((status) => {
//         if (status === 'unattended') {
//           return 'allotted';
//         }
//         return status;
//       }),
//     };
//   }
//   if (get(filters, 'courses', []).length) {
//     sessionFilters['course.typeId'] = {
//       $in: get(filters, 'courses'),
//     };
//   }
//   return {
//     ...sessionFilters,
//     ...classroomFilters,
//   };
// };

const getSessionStatus = (session) => {
  const sessionStatus = get(session, 'sessionStatus', 'allotted');
  if (sessionStatus === 'allotted') {
    /**
     * Checking If allotted session lies before current date.
     */
    if (isBefore(get(session, 'bookingDate'), new Date())) {
      if (isToday(get(session, 'bookingDate'))) {
        const currentSlot = new Date().getHours() || 0;
        let sessionSlot = 23;
        for (let i = 0; i < 24; i++) {
          if (session[`slot${i}`]) {
            sessionSlot = i;
          }
        }
        if (currentSlot < sessionSlot) {
          return sessionStatus;
        }
      }
      return 'unattended';
    }
    return sessionStatus;
  }
  return sessionStatus;
};

const transformMongoResults = (batchSessions, adhocSessions, events) => {
  const finalResult = [];
  if (batchSessions && batchSessions.length) {
    batchSessions.forEach((session) => {
      finalResult.push({
        id: get(session, 'id'),
        bookingDate: get(session, 'bookingDate', null),
        sessionStartDate: get(session, 'sessionStartDate', null),
        sessionEndDate: get(session, 'sessionEndDate', null),
        sessionStatus: getSessionStatus(session),
        sessionMode: get(session, 'sessionMode', 'online'),
        sessionRecordingLink: get(session, 'sessionRecordingLink', null),
        attendance: get(session, 'attendance', []),
        sessionType: 'learning',
        documentType: 'batchSession',
        startMinutes: get(session, 'startMinutes', 0),
        endMinutes: get(session, 'endMinutes', 0),
        classroom: {
          id: get(session, 'classroom.id', ''),
          code: get(session, 'classroom.code', ''),
          classroomTitle: get(session, 'classroom.classroomTitle', ''),
          students: get(session, 'classroom.students', []),
          description: get(session, 'classroom.description', null),
          classes: get(session, 'classroom.classes', null),
          school: get(session, 'classroom.school', null),
        },
        sessionOtp: get(session, 'schoolSessionOtp', []),
        ...getSlotTimeFields(session),
        topic: get(session, 'topic', null),
        previousTopic: null,
      });
    });
  }
  if (adhocSessions && adhocSessions.length) {
    adhocSessions.forEach((session) => {
      finalResult.push({
        id: get(session, 'id'),
        bookingDate: get(session, 'bookingDate', null),
        sessionStartDate: get(session, 'sessionStartDate', null),
        sessionEndDate: get(session, 'sessionEndDate', null),
        sessionStatus: getSessionStatus(session),
        sessionMode: get(session, 'sessionMode', 'online'),
        sessionRecordingLink: get(session, 'sessionRecordingLink', null),
        attendance: get(session, 'attendance', []),
        sessionType: get(session, 'type', null),
        documentType: 'adhocSession',
        startMinutes: get(session, 'startMinutes', 0),
        endMinutes: get(session, 'endMinutes', 0),
        classroom: {
          id: get(session, 'classroom.id', ''),
          code: get(session, 'classroom.code', ''),
          classroomTitle: get(session, 'classroom.classroomTitle', ''),
          students: get(session, 'classroom.students', []),
          description: get(session, 'classroom.description', null),
          classes: get(session, 'classroom.classes', null),
          school: get(session, 'classroom.school', null),
        },
        sessionOtp: get(session, 'schoolSessionOtp', null),
        ...getSlotTimeFields(session),
        topic: null,
        previousTopic: get(session, 'previousTopic', null),
      });
    });
  }
  if (events && events.length) {
    events.forEach((event) => {
      finalResult.push({
        id: get(event, 'id'),
        bookingDate: get(event, 'startDate', null),
        eventType: get(event, 'eventType', 'holiday'),
        documentType: 'event',
        startMinutes: get(event, 'startMinutes', 0),
        endMinutes: get(event, 'endMinutes', 0),
        classroom: {
          code: get(event, 'batch.code', ''),
          classroomTitle: get(event, 'batch.classroomTitle', ''),
        },
        ...getSlotTimeFields(event),
      });
    });
  }
  return sortBy(finalResult, ['bookingDate']);
};

const classroomHomeworkReport = (async (root, params, context) => {
  const authentication = ifAuthorized(context);

  if (!(authentication && authentication.app && authentication.user)) {
    throw new UnauthorizedOperationError();
  }

  return {
    overall: {
      submittedPercentage: 78,
      attemptedPercentage: 10,
      unattemptedPercentage: 12,
    },
    quiz: {
      submittedPercentage: 56,
      attemptedPercentage: 12,
      unattemptedPercentage: 32,
      totalQuestions: 10,
      averageScore: 8,
      averageCorrect: 6,
      averageIncorrect: 3,
      averagePartiallyCorrect: 2,
    },
    coding: {
      submittedPercentage: 56,
      attemptedPercentage: 12,
      unattemptedPercentage: 32,
      totalQuestions: 10,
      averageScore: 8,
      averageCorrect: 6,
      averageIncorrect: 3,
      averagePartiallyCorrect: 2,
    },
    pq: {
      submittedPercentage: 56,
      attemptedPercentage: 12,
      unattemptedPercentage: 32,
      totalQuestions: 10,
      averageScore: 8,
      averageCorrect: 6,
      averageIncorrect: 3,
      averagePartiallyCorrect: 2,
    },
  };

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

  /**
   * Aggregation Queries for batchSession & adhocSessions
   */
  const batchSessionRes = await batchSessionModel.aggregate(
    getBatchSessionAggregation({
      batchId,
      topicId,
    }),
  );

  const students = get(batchSessionRes[0], 'batch.students');
  const mmsArray = [];
  students.forEach(async (student) => {
    const userId = get(student, 'user.id');
    const mentorMenteeSessionRes = await mentorMenteeSessionModel.aggregate(
      getMentorMenteeSessionAggregation({
        userId,
        topicId,
      }),
    );
    const userQuizReportAggregation = await userQuizReportModel.aggregate(
      getUserQuizReportAggregation({
        userId,
        topicId,
      }),
    );
    if (mentorMenteeSessionRes.length) {
      mmsArray.push(mentorMenteeSessionRes);
    }
    if (userQuizReportAggregation.length) {
      mmsArray.push(userQuizReportAggregation);
    }
  });

  /**
   * Transforming aggregation result into required format i.e ClassroomSessionResult Type
   */
  const transformedClassroomResult = transformMongoResults(
    batchSessionRes,
  );

  if (
    filters
    && get(filters, 'sessionStatus', []).length
    && (get(filters, 'sessionStatus', []).includes('unattended') || get(filters, 'sessionStatus', []).includes('allotted'))
  ) {
    return (transformedClassroomResult || []).filter((session) => {
      if (get(session, 'documentType') === 'event') {
        return true;
      }
      if (get(filters, 'sessionStatus', []).includes(get(session, 'sessionStatus'))) {
        return true;
      }
      return false;
    });
  }
  return transformedClassroomResult || [];
});

export default classroomHomeworkReport;

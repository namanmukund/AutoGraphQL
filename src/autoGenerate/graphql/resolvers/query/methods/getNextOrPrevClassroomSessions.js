/* eslint-disable no-await-in-loop */
import { get, sortBy, orderBy } from 'lodash';
import { slotTimes } from '../../../../../../constants';
import { UnauthorizedOperationError } from '../../../../../../constants/errors';
import { ifAuthorized, log } from '../../../../../../utils';
import { QueryController } from '../../../controllers';

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

const getBatchSessionAggregation = ({
  classroomId,
  bookingDate,
  queryType = '',
  limit,
  documentType,
}) => {
  const matchQuery = { 'batch.typeId': classroomId };
  const classroomMatchQuery = {};
  if (documentType === 'classroom') {
    classroomMatchQuery['classroom.documentType'] = 'classroom';
  }
  if (queryType === 'next') {
    matchQuery.bookingDate = {
      $gte: new Date(bookingDate),
    };
    matchQuery.sessionStatus = {
      $in: ['allotted', 'started'],
    };
  } else {
    matchQuery.bookingDate = {
      $lte: new Date(bookingDate),
    };
    matchQuery.sessionStatus = {
      $in: ['completed'],
    };
  }
  return [
    {
      $match: {
        ...matchQuery,
      },
    },
    {
      $project: {
        id: 1,
        bookingDate: 1,
        sessionStartDate: 1,
        sessionEndDate: 1,
        sessionStatus: 1,
        startMinutes: 1,
        endMinutes: 1,
        sessionMode: 1,
        sessionRecordingLink: 1,
        batch: 1,
        topic: 1,
        course: 1,
        mentorSession: 1,
        ...getSlotTimeFields(),
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
            $lookup: {
              from: 'SchoolClass',
              localField: 'classes.typeId',
              foreignField: 'id',
              as: 'classes',
            },
          },
          {
            $lookup: {
              from: 'StudentProfile',
              localField: 'students.typeId',
              foreignField: 'id',
              as: 'students',
            },
          },
          {
            $project: {
              code: 1,
              classroomTitle: 1,
              description: 1,
              school: 1,
              students: {
                grade: 1,
                section: 1,
                user: 1,
              },
              classes: {
                id: 1,
                grade: 1,
                section: 1,
              },
              documentType: 1,
            },
          },
        ],
        as: 'classroom',
      },
    },
    {
      $lookup: {
        from: 'Topic',
        let: { topicId: '$topic.typeId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$id', '$$topicId'],
              },
            },
          },
          {
            $lookup: {
              from: 'File',
              let: {
                thumbnailId: '$thumbnailSmall.typeId',
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$id', '$$thumbnailId'],
                    },
                  },
                },
                {
                  $project: {
                    id: 1,
                    uri: 1,
                    name: 1,
                  },
                },
              ],
              as: 'thumbnailSmall',
            },
          },
          {
            $project: {
              id: 1,
              order: 1,
              title: 1,
              description: 1,
              thumbnailSmall: {
                $arrayElemAt: ['$thumbnailSmall', 0],
              },
            },
          },
        ],
        as: 'topic',
      },
    },
    {
      $match: {
        ...classroomMatchQuery,
      },
    },
    {
      $project: {
        id: 1,
        bookingDate: 1,
        sessionStartDate: 1,
        sessionEndDate: 1,
        sessionStatus: 1,
        sessionMode: 1,
        startMinutes: 1,
        endMinutes: 1,
        sessionRecordingLink: 1,
        classroom: {
          $arrayElemAt: ['$classroom', 0],
        },
        topic: {
          $arrayElemAt: ['$topic', 0],
        },
        course: 1,
        ...getSlotTimeFields(),
      },
    },
    {
      $sort: {
        bookingDate: queryType === 'next' ? 1 : -1,
      },
    },
    {
      $limit: limit,
    },
  ];
};

const getAdhocSessionAggregation = ({
  classroomId,
  bookingDate,
  queryType = '',
  limit,
  documentType,
}) => {
  const matchQuery = { 'batch.typeId': classroomId };
  const classroomMatchQuery = {};
  if (documentType === 'classroom') {
    classroomMatchQuery['classroom.documentType'] = 'classroom';
  }
  if (queryType === 'next') {
    matchQuery.bookingDate = {
      $gte: new Date(bookingDate),
    };
    matchQuery.sessionStatus = {
      $in: ['allotted'],
    };
  } else {
    matchQuery.bookingDate = {
      $lte: new Date(bookingDate),
    };
    matchQuery.sessionStatus = {
      $in: ['started', 'completed'],
    };
  }
  return [
    {
      $match: {
        ...matchQuery,
      },
    },
    {
      $project: {
        id: 1,
        bookingDate: 1,
        sessionStartDate: 1,
        sessionEndDate: 1,
        sessionStatus: 1,
        sessionMode: 1,
        startMinutes: 1,
        endMinutes: 1,
        sessionRecordingLink: 1,
        type: 1,
        batch: 1,
        previousTopic: 1,
        course: 1,
        mentorSession: 1,
        ...getSlotTimeFields(),
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
            $lookup: {
              from: 'SchoolClass',
              localField: 'classes.typeId',
              foreignField: 'id',
              as: 'classes',
            },
          },
          {
            $lookup: {
              from: 'StudentProfile',
              localField: 'students.typeId',
              foreignField: 'id',
              as: 'students',
            },
          },
          {
            $project: {
              code: 1,
              classroomTitle: 1,
              description: 1,
              school: 1,
              students: {
                grade: 1,
                section: 1,
                user: 1,
              },
              classes: {
                id: 1,
                grade: 1,
                section: 1,
              },
              documentType: 1,
            },
          },
        ],
        as: 'classroom',
      },
    },
    {
      $lookup: {
        from: 'Topic',
        let: { topicId: '$previousTopic.typeId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$id', '$$topicId'],
              },
            },
          },
          {
            $lookup: {
              from: 'File',
              let: {
                thumbnailId: '$thumbnailSmall.typeId',
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$id', '$$thumbnailId'],
                    },
                  },
                },
                {
                  $project: {
                    id: 1,
                    uri: 1,
                    name: 1,
                  },
                },
              ],
              as: 'thumbnailSmall',
            },
          },
          {
            $project: {
              id: 1,
              order: 1,
              title: 1,
              description: 1,
              thumbnailSmall: {
                $arrayElemAt: ['$thumbnailSmall', 0],
              },
            },
          },
        ],
        as: 'previousTopic',
      },
    },
    {
      $match: {
        ...classroomMatchQuery,
      },
    },
    {
      $project: {
        id: 1,
        bookingDate: 1,
        sessionStartDate: 1,
        sessionEndDate: 1,
        sessionStatus: 1,
        sessionMode: 1,
        startMinutes: 1,
        endMinutes: 1,
        type: 1,
        sessionRecordingLink: 1,
        classroom: {
          $arrayElemAt: ['$classroom', 0],
        },
        topic: {
          $arrayElemAt: ['$previousTopic', 0],
        },
        course: 1,
        ...getSlotTimeFields(),
      },
    },
    {
      $sort: {
        bookingDate: queryType === 'next' ? 1 : -1,
      },
    },
    {
      $limit: limit,
    },
  ];
};

const mentorMentorMenteeSessionAggregation = (topicId, userIds) => [
  {
    $match: {
      sessionStatus: 'completed',
      'topic.typeId': topicId,
    },
  },
  {
    $lookup: {
      from: 'MenteeSession',
      let: { menteeSessionId: '$menteeSession.typeId' },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$id', '$$menteeSessionId'],
            },
          },
        },
        {
          $lookup: {
            from: 'User',
            localField: 'user.typeId',
            foreignField: 'id',
            as: 'user',
          },
        },
        {
          $project: {
            user: {
              $arrayElemAt: ['$user', 0],
            },
          },
        },
        {
          $project: {
            user: {
              id: 1,
              name: 1,
              email: 1,
              username: 1,
            },
          },
        },
      ],
      as: 'menteeSession',
    },
  },
  {
    $lookup: {
      from: 'Topic',
      let: { topicId: '$topic.typeId' },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$id', '$$topicId'],
            },
          },
        },
        {
          $project: {
            _id: 0,
            id: 1,
            title: 1,
            topicComponentRule: 1,
          },
        },
      ],
      as: 'topic',
    },
  },
  {
    $project: {
      menteeSession: {
        $arrayElemAt: ['$menteeSession', 0],
      },
      topic: {
        $arrayElemAt: ['$topic', 0],
      },
      bookingDate: 1,
      isSubmittedForReview: 1,
      isQuizSubmitted: 1,
      isAssignmentSubmitted: 1,
      isAssignmentAttempted: 1,
      isPracticeSubmitted: 1,
      quizSubmitDate: 1,
      practiceSubmitDate: 1,
      assignmentSubmitDate: 1,
    },
  },
  {
    $match: {
      'menteeSession.user.id': {
        $in: userIds || [],
      },
    },
  },
];

const getTypeQueryController = (
  typeName,
  authentication = {
    bypass: true,
  },
) => new QueryController(typeName, authentication);

const getHomeworkCompletedMeta = async (session, model, queryType = 'next') => {
  if (queryType === 'next') {
    return 'NA';
  }
  const topicId = get(session, 'topic.id');
  const userIds = get(session, 'classroom.students', []).map((el) => get(el, 'user.typeId'));
  let homeworkCompletedCount = 0;
  let isHomeworkExists = false;
  let isQuizExists = false;
  let quizSubmittedCount = 0;
  if (topicId && userIds.length) {
    const mmsData = await model.aggregate(mentorMentorMenteeSessionAggregation(topicId, userIds));
    if (mmsData && mmsData.length) {
      const topicComponentRule = get(mmsData, '0.topic.topicComponentRule', []);
      topicComponentRule.forEach((rule) => {
        if (['quiz', 'homeworkAssignment', 'homeworkPractice'].includes(get(rule, 'componentName'))) {
          isHomeworkExists = true;
        }
        if (['quiz'].includes(get(rule, 'componentName'))) {
          isQuizExists = true;
        }
      });
      const filteredResult = mmsData.filter((el) => get(el, 'isSubmittedForReview') === true);
      const filteredQuizResult = mmsData.filter((el) => get(el, 'isQuizSubmitted') === true);
      homeworkCompletedCount = filteredResult.length || 0;
      quizSubmittedCount = filteredQuizResult.length || 0;
    }
  }
  return {
    homeworkCompletedCount, quizSubmittedCount, isHomeworkExists, isQuizExists,
  };
};

const transformMongoResults = async (batchSessions, adhocSessions, queryType) => {
  const finalResult = [];
  const mentorMenteeSessionModel = getTypeQueryController('MentorMenteeSession');
  if (batchSessions && batchSessions.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const batchSession of batchSessions) {
      const homeworkMeta = await getHomeworkCompletedMeta(batchSession, mentorMenteeSessionModel, queryType);
      finalResult.push({
        id: get(batchSession, 'id'),
        bookingDate: get(batchSession, 'bookingDate', null),
        sessionStartDate: get(batchSession, 'sessionStartDate', null),
        sessionEndDate: get(batchSession, 'sessionEndDate', null),
        sessionStatus: get(batchSession, 'sessionStatus', 'allotted'),
        sessionMode: get(batchSession, 'sessionMode', 'online'),
        sessionRecordingLink: get(batchSession, 'sessionRecordingLink', null),
        recordType: 'batchSession',
        ...getSlotTimeFields(batchSession),
        startMinutes: get(batchSession, 'startMinutes', 0),
        endMinutes: get(batchSession, 'endMinutes', 0),
        topicId: get(batchSession, 'topic.id', null),
        topicTitle: get(batchSession, 'topic.title', null),
        topicOrder: get(batchSession, 'topic.order', null),
        thumbnailSmall: get(batchSession, 'topic.thumbnailSmall', null),
        totalStudents: get(batchSession, 'classroom.students', []).length,
        completedHomeworkMeta: homeworkMeta.homeworkCompletedCount,
        completedQuizMeta: homeworkMeta.quizSubmittedCount,
        isHomeworkExists: homeworkMeta.isHomeworkExists,
        isQuizExists: homeworkMeta.isQuizExists,
      });
    }
  }
  if (adhocSessions && adhocSessions.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const adhocSession of adhocSessions) {
      const homeworkMeta = await getHomeworkCompletedMeta(adhocSession, mentorMenteeSessionModel, queryType);
      finalResult.push({
        id: get(adhocSession, 'id'),
        bookingDate: get(adhocSession, 'bookingDate', null),
        sessionStartDate: get(adhocSession, 'sessionStartDate', null),
        sessionEndDate: get(adhocSession, 'sessionEndDate', null),
        sessionStatus: get(adhocSession, 'sessionStatus', 'allotted'),
        sessionMode: get(adhocSession, 'sessionMode', 'online'),
        sessionRecordingLink: get(adhocSession, 'sessionRecordingLink', null),
        recordType: 'adhocSession',
        startMinutes: get(adhocSession, 'startMinutes', 0),
        endMinutes: get(adhocSession, 'endMinutes', 0),
        ...getSlotTimeFields(adhocSession),
        topicTitle: get(adhocSession, 'topic.title', null),
        topicOrder: get(adhocSession, 'topic.order', null),
        thumbnailSmall: get(adhocSession, 'topic.thumbnailSmall', null),
        totalStudents: get(adhocSession, 'classroom.students', []).length,
        completedHomeworkMeta: homeworkMeta.homeworkCompletedCount,
        completedQuizMeta: homeworkMeta.quizSubmittedCount,
        isHomeworkExists: homeworkMeta.isHomeworkExists,
        isQuizExists: homeworkMeta.isQuizExists,
      });
    }
  }
  return finalResult;
};

const getNextOrPrevClassroomSessions = async (root, params, context) => {
  const startTime = process.hrtime();
  const authentication = ifAuthorized(context);

  if (!(authentication && authentication.app && authentication.user)) {
    throw new UnauthorizedOperationError();
  }
  const finalTransformedResult = [];
  const inputArr = get(params, 'input', []);
  if (inputArr && inputArr.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const input of inputArr) {
      const classroomId = get(input, 'classroomId');
      const bookingDate = get(input, 'bookingDate');
      const documentType = get(input, 'documentType');
      const limit = get(input, 'limit', 0);
      const queryType = get(input, 'queryType');
      if (limit < 1 || limit > 3) {
        throw new Error('Limit should be less than or equal to 3');
      }

      const batchSessionModel = getTypeQueryController(
        'BatchSession',
        authentication,
      );
      const adhocSessionModel = getTypeQueryController(
        'AdhocSession',
        authentication,
      );

      /**
       * Aggregation Queries for batchSession & adhocSessions
       */
      const batchSessionRes = await batchSessionModel.aggregate(
        getBatchSessionAggregation({
          classroomId,
          bookingDate,
          queryType,
          limit,
          documentType,
        }),
      );

      const adhocSessionRes = await adhocSessionModel.aggregate(
        getAdhocSessionAggregation({
          classroomId,
          bookingDate,
          queryType,
          limit,
          documentType,
        }),
      );

      /**
       * Transforming aggregation result into required format i.e ClassroomSessionResult Type
       */
      const transformedClassroomResult = await transformMongoResults(
        batchSessionRes,
        adhocSessionRes,
        queryType,
        limit,
      );

      log(`Total Doc Returned ---> ${transformedClassroomResult.length}`);
      const stopTime = process.hrtime(startTime);
      log(`Total Time Taken ---> ${(stopTime[0] * 1e9 + stopTime[1]) / 1e9} seconds`);

      /**
       * First sort by asc or desc depending on queryType
       * and then return limited result as specified in input
       */
      if (queryType === 'next') {
        finalTransformedResult.push({
          classroomId,
          limit,
          queryType,
          documentType,
          sessions: sortBy(transformedClassroomResult, ['bookingDate']).slice(0, limit),
        });
      } else {
        finalTransformedResult.push({
          classroomId,
          limit,
          queryType,
          documentType,
          sessions: orderBy(transformedClassroomResult, ['bookingDate'], ['desc']).slice(
            0,
            limit,
          ),
        });
      }
    }
  }
  return finalTransformedResult || [];
};

export default getNextOrPrevClassroomSessions;

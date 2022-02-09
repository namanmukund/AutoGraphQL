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
}) => {
    const matchQuery = { 'batch.typeId': classroomId }
    if (queryType === 'next') {
        matchQuery.bookingDate = {
            $gte: new Date(bookingDate)
        };
    } else {
        matchQuery.bookingDate = {
            $lte: new Date(bookingDate)
        };
    }
    return [
        {
            $match: {
                ...matchQuery
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
            sessionRecordingLink: 1,
            batch: 1,
            topic: 1,
            course: 1,
            mentorSession: 1,
            attendance: 1,
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
                $project: {
                    code: 1,
                    classroomTitle: 1,
                    description: 1,
                    school: 1,
                    students: 1,
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
        // {
        //     $match: {
        //         'classroom.documentType': 'classroom',
        //     },
        // },
        {
            $project: {
                id: 1,
                bookingDate: 1,
                sessionStartDate: 1,
                sessionEndDate: 1,
                sessionStatus: 1,
                sessionMode: 1,
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
    ];
}

const getAdhocSessionAggregation = ({
  classroomId,
  bookingDate,
  queryType = '',
}) => {
  const matchQuery = { 'batch.typeId': classroomId };
  if (queryType === 'next') {
    matchQuery.bookingDate = {
      $gte: new Date(bookingDate),
    };
  } else {
    matchQuery.bookingDate = {
      $lte: new Date(bookingDate),
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
            $project: {
              code: 1,
              classroomTitle: 1,
              description: 1,
              school: 1,
              students: 1,
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
        'classroom.documentType': 'classroom',
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
        type: 1,
        sessionRecordingLink: 1,
        classroom: {
          $arrayElemAt: ['$classroom', 0],
        },
        previousTopic: {
          $arrayElemAt: ['$previousTopic', 0],
        },
        course: 1,
        ...getSlotTimeFields(),
      },
    },
  ];
};

const getTypeQueryController = (
  typeName,
  authentication = {
    bypass: true,
  },
) => new QueryController(typeName, authentication);

const transformMongoResults = (batchSessions, adhocSessions) => {
  const finalResult = [];
  if (batchSessions && batchSessions.length) {
    batchSessions.forEach((session) => {
      finalResult.push({
        id: get(session, 'id'),
        bookingDate: get(session, 'bookingDate', null),
        sessionStartDate: get(session, 'sessionStartDate', null),
        sessionEndDate: get(session, 'sessionEndDate', null),
        sessionStatus: get(session, 'sessionStatus', 'allotted'),
        sessionMode: get(session, 'sessionMode', 'online'),
        sessionRecordingLink: get(session, 'sessionRecordingLink', null),
        documentType: 'batchSession',
        ...getSlotTimeFields(session),
        topicTitle: get(session, 'topic.title', null),
        topicOrder: get(session, 'topic.order', null),
        thumbnailSmall: get(session, 'topic.thumbnailSmall', null),
        totalStudents: get(session, 'classroom.students', []).length,
        completedHomeworkMeta: 0,
      });
    });
  }
  if (adhocSessions && adhocSessions.length) {
    adhocSessions.fprEach((session) => {
      finalResult.push({
        id: get(session, 'id'),
        bookingDate: get(session, 'bookingDate', null),
        sessionStartDate: get(session, 'sessionStartDate', null),
        sessionEndDate: get(session, 'sessionEndDate', null),
        sessionStatus: get(session, 'sessionStatus', 'allotted'),
        sessionMode: get(session, 'sessionMode', 'online'),
        sessionRecordingLink: get(session, 'sessionRecordingLink', null),
        documentType: 'adhocSession',
        ...getSlotTimeFields(session),
        topicTitle: get(session, 'topic.title', null),
        topicOrder: get(session, 'topic.order', null),
        thumbnailSmall: get(session, 'topic.thumbnailSmall', null),
        totalStudents: get(session, 'classroom.students', []).length,
        completedHomeworkMeta: 0,
      });
    });
  }
  return finalResult;
};

const getNextOrPrevClassroomSessions = async (root, params, context) => {
  const startTime = process.hrtime();
  const authentication = ifAuthorized(context);

  if (!(authentication && authentication.app && authentication.user)) {
    throw new UnauthorizedOperationError();
  }

  const classroomId = get(params, 'input.classroomId');
  const bookingDate = get(params, 'input.bookingDate');
  const limit = get(params, 'input.limit', 0);
  const queryType = get(params, 'input.queryType');
  if ((limit < 1) || (limit > 3)) {
    throw new Error('Limit should be less than or equal to 3')
  }

  const batchSessionModel = getTypeQueryController(
    'BatchSession',
    authentication
  );
  const adhocSessionModel = getTypeQueryController(
    'AdhocSession',
    authentication
  );
    
  /**
   * Aggregation Queries for batchSession & adhocSessions
   */
  const batchSessionRes = await batchSessionModel.aggregate(
    getBatchSessionAggregation({
      classroomId,
      bookingDate,
      queryType,
    })
  );

  const adhocSessionRes = await adhocSessionModel.aggregate(
    getAdhocSessionAggregation({
      classroomId,
      bookingDate,
      queryType,
    })
  );

  /**
   * Transforming aggregation result into required format i.e ClassroomSessionResult Type
   */
  const transformedClassroomResult = transformMongoResults(
    batchSessionRes,
    adhocSessionRes,
    limit,
    queryType
  );

  
  log(`Total Doc Returned ---> ${transformedClassroomResult.length}`);
  const stopTime = process.hrtime(startTime);
  log(
    `Total Time Taken ---> ${(stopTime[0] * 1e9 + stopTime[1]) / 1e9} seconds`
  );

  /**
   * First sort by asc or desc depending on queryType
   * and then return limited result as specified in input
   */
  if (queryType === 'next') {
    return sortBy(transformedClassroomResult, ['bookingDate']).slice(0, limit);
  } else {
    return orderBy(transformedClassroomResult, ['bookingDate'], ['desc']).slice(0, limit);
  }
};

export default getNextOrPrevClassroomSessions;

import { get, sortBy } from 'lodash';
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
  startDate,
  endDate,
  docFilters = {},
}) => [
  {
    $match: {
      bookingDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
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
    $lookup: {
      from: 'MentorSession',
      let: { mentorSessionId: '$mentorSession.typeId' },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$id', '$$mentorSessionId'],
            },
          },
        },
        {
          $lookup: {
            from: 'User',
            let: { userId: '$user.typeId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$id', '$$userId'],
                  },
                },
              },
              {
                $project: {
                  id: 1,
                  name: 1,
                  role: 1,
                  email: 1,
                },
              },
            ],
            as: 'mentorUser',
          },
        },
        {
          $project: {
            user: {
              $arrayElemAt: ['$mentorUser', 0],
            },
          },
        },
      ],
      as: 'mentorSession',
    },
  },
  // {
  //   $match: {
  //     'mentorSession.user.id': mentorId,
  //     'classroom.documentType': 'classroom',
  //   },
  // },
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
      mentorSession: {
        $arrayElemAt: ['$mentorSession', 0],
      },
      topic: {
        $arrayElemAt: ['$topic', 0],
      },
      course: 1,
      attendance: 1,
      ...getSlotTimeFields(),
    },
  },
  {
    $match: {
      ...docFilters,
    },
  },
];

const getAdhocSessionAggregation = ({
  startDate,
  endDate,
  docFilters = {},
}) => [
  {
    $match: {
      bookingDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
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
    $lookup: {
      from: 'MentorSession',
      let: { mentorSessionId: '$mentorSession.typeId' },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$id', '$$mentorSessionId'],
            },
          },
        },
        {
          $lookup: {
            from: 'User',
            let: { userId: '$user.typeId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$id', '$$userId'],
                  },
                },
              },
              {
                $project: {
                  id: 1,
                  name: 1,
                  role: 1,
                  email: 1,
                },
              },
            ],
            as: 'mentorUser',
          },
        },
        {
          $project: {
            user: {
              $arrayElemAt: ['$mentorUser', 0],
            },
          },
        },
      ],
      as: 'mentorSession',
    },
  },
  // {
  //   $match: {
  //     'mentorSession.user.id': mentorId,
  //     'classroom.documentType': 'classroom',
  //   },
  // },
  {
    $project: {
      id: 1,
      bookingDate: 1,
      sessionStartDate: 1,
      sessionEndDate: 1,
      sessionStatus: 1,
      sessionMode: 1,
      type: 1,
      startMinutes: 1,
      endMinutes: 1,
      sessionRecordingLink: 1,
      classroom: {
        $arrayElemAt: ['$classroom', 0],
      },
      mentorSession: {
        $arrayElemAt: ['$mentorSession', 0],
      },
      previousTopic: {
        $arrayElemAt: ['$previousTopic', 0],
      },
      course: 1,
      attendance: 1,
      ...getSlotTimeFields(),
    },
  },
  {
    $match: {
      ...docFilters,
    },
  },
];

const getTypeQueryController = (
  typeName,
  authentication = {
    bypass: true,
  },
) => new QueryController(typeName, authentication);

const constructDocFilters = (filters) => {
  /**
   * Example Filters ->
   *  grades: [ 'Grade1', 'Grade2' ],
   *  sections: [ 'A', 'B' ],
   *  courses: [ 'ID1', 'ID2' ],
   *  sessionStatus: [ 'started', 'completed' ]
   *  schools: ['ID']
   */
  const sessionFilters = {};
  const classroomFilters = {};
  if (get(filters, 'grades', []).length) {
    classroomFilters['classroom.classes.grade'] = {
      $in: get(filters, 'grades'),
    };
  }
  if (get(filters, 'sections', []).length) {
    classroomFilters['classroom.classes.section'] = {
      $in: get(filters, 'sections', []),
    };
  }
  if (get(filters, 'schools', []).length) {
    classroomFilters['classroom.schools.typeId'] = {
      $in: get(filters, 'schools'),
    };
  }
  if (get(filters, 'sessionStatusFilter', []).length) {
    sessionFilters.sessionStatus = {
      $in: ['allotted', 'completed'],
    };
  }
  if (get(filters, 'courses', []).length) {
    sessionFilters['course.typeId'] = {
      $in: get(filters, 'courses'),
    };
  }
  return {
    ...sessionFilters,
    ...classroomFilters,
  };
};

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
        attendance: get(session, 'attendance', []),
        sessionType: 'learning',
        documentType: 'batchSession',
        startMinutes: get(session, 'startMinutes', 0),
        endMinutes: get(session, 'endMinutes', 0),
        classroom: {
          code: get(session, 'classroom.code', ''),
          classroomTitle: get(session, 'classroom.classroomTitle', ''),
          description: get(session, 'classroom.description', null),
          classes: get(session, 'classroom.classes', null),
          school: get(session, 'classroom.school', null),
        },
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
        sessionStatus: get(session, 'sessionStatus', 'allotted'),
        sessionMode: get(session, 'sessionMode', 'online'),
        sessionRecordingLink: get(session, 'sessionRecordingLink', null),
        attendance: get(session, 'attendance', []),
        sessionType: get(session, 'type', null),
        documentType: 'adhocSession',
        startMinutes: get(session, 'startMinutes', 0),
        endMinutes: get(session, 'endMinutes', 0),
        classroom: {
          code: get(session, 'classroom.code', ''),
          classroomTitle: get(session, 'classroom.classroomTitle', ''),
          description: get(session, 'classroom.description', null),
          classes: get(session, 'classroom.classes', null),
          school: get(session, 'classroom.school', null),
        },
        ...getSlotTimeFields(session),
        topic: null,
        previousTopic: get(session, 'previousTopic', null),
      });
    });
  }
  return sortBy(finalResult, ['bookingDate']);
};

const classroomSessions = (async (root, params, context) => {
  const startTime = process.hrtime();
  const authentication = ifAuthorized(context);

  if (!(authentication && authentication.app && authentication.user)) {
    throw new UnauthorizedOperationError();
  }

  const filters = get(params, 'filter', null);
  const mentorId = get(filters, 'userId');
  const startDate = get(filters, 'startDate');
  const endDate = get(filters, 'endDate');
  log(`${mentorId}`);
  const batchSessionModel = getTypeQueryController(
    'BatchSession',
    authentication,
  );
  const adhocSessionModel = getTypeQueryController(
    'AdhocSession',
    authentication,
  );

  /**
   * Constructing optional filters for mongo aggregation.
   */
  const docFilters = constructDocFilters(filters);

  /**
   * Aggregation Queries for batchSession & adhocSessions
   */
  const batchSessionRes = await batchSessionModel.aggregate(
    getBatchSessionAggregation({
      startDate,
      endDate,
      docFilters,
    }),
  );

  const adhocSessionRes = await adhocSessionModel.aggregate(
    getAdhocSessionAggregation({
      startDate,
      endDate,
      docFilters,
    }),
  );

  /**
   * Transforming aggregation result into required format i.e ClassroomSessionResult Type
   */
  const transformedClassroomResult = transformMongoResults(
    batchSessionRes,
    adhocSessionRes,
  );

  log(`Total Doc Returned ---> ${transformedClassroomResult.length}`);
  const stopTime = process.hrtime(startTime);
  log(`Total Time Taken ---> ${(stopTime[0] * 1e9 + stopTime[1]) / 1e9} seconds`);
  return transformedClassroomResult || [];
});

export default classroomSessions;

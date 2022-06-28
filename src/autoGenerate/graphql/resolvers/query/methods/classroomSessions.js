/* eslint-disable no-plusplus */
import { isBefore, isToday } from 'date-fns';
import { get, sortBy } from 'lodash';
import moment from 'moment';
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

const getBatchSessionAggregation = ({
  startDate,
  endDate,
  mentorIds,
  docFilters = {},
  documentType,
}) => {
  const mentorIdsFilter = {};
  if (mentorIds && mentorIds.length) {
    mentorIdsFilter['mentorSession.user.id'] = {
      $in: mentorIds,
    };
  }
  return [
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
        schoolSessionsOtp: 1,
        coursePackage: 1,
        sessionStartedByMentorAt: 1,
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
              id: 1,
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
              coursePackageTopicRule: 1,
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
              classType: 1,
              topicComponentRule: 1,
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
    {
      $lookup: {
        from: 'SchoolSessionOtp',
        localField: 'schoolSessionsOtp.typeId',
        foreignField: 'id',
        as: 'schoolSessionOtp',
      },
    },
    {
      $lookup: {
        from: 'Course',
        let: { courseId: '$course.typeId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$id', '$$courseId'],
              },
            },
          },
          {
            $project: {
              id: 1,
              title: 1,
              defaultLoComponentRule: 1,
            },
          },
        ],
        as: 'course',
      },
    },
    {
      $lookup: {
        from: 'CoursePackage',
        let: { coursePackageId: '$coursePackage.typeId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$id', '$$coursePackageId'],
              },
            },
          },
          {
            $project: {
              _id: 0,
              id: 1,
              topics: 1,
            },
          },
        ],
        as: 'coursePackage',
      },
    },
    {
      $match: {
        ...mentorIdsFilter,
        'classroom.documentType': documentType,
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
        sessionStartedByMentorAt: 1,
        classroom: {
          $arrayElemAt: ['$classroom', 0],
        },
        mentorSession: {
          $arrayElemAt: ['$mentorSession', 0],
        },
        topic: {
          $arrayElemAt: ['$topic', 0],
        },
        course: {
          $arrayElemAt: ['$course', 0],
        },
        coursePackage: {
          $arrayElemAt: ['$coursePackage', 0],
        },
        schoolSessionOtp: {
          grade: 1,
          section: 1,
          otp: 1,
        },
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
};

const getAdhocSessionAggregation = ({
  startDate,
  endDate,
  mentorIds,
  docFilters = {},
  documentType,
}) => {
  const mentorIdsFilter = {};
  if (mentorIds && mentorIds.length) {
    mentorIdsFilter['mentorSession.user.id'] = {
      $in: mentorIds,
    };
  }
  return [
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
        schoolSessionsOtp: 1,
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
              id: 1,
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
              coursePackageTopicRule: 1,
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
              classType: 1,
              topicComponentRule: 1,
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
    {
      $lookup: {
        from: 'SchoolSessionOtp',
        localField: 'schoolSessionsOtp.typeId',
        foreignField: 'id',
        as: 'schoolSessionOtp',
      },
    },
    {
      $lookup: {
        from: 'Course',
        let: { courseId: '$course.typeId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$id', '$$courseId'],
              },
            },
          },
          {
            $project: {
              id: 1,
              title: 1,
              defaultLoComponentRule: 1,
            },
          },
        ],
        as: 'course',
      },
    },
    {
      $lookup: {
        from: 'CoursePackage',
        let: { coursePackageId: '$coursePackage.typeId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$id', '$$coursePackageId'],
              },
            },
          },
          {
            $project: {
              _id: 0,
              id: 1,
              topics: 1,
            },
          },
        ],
        as: 'coursePackage',
      },
    },
    {
      $match: {
        ...mentorIdsFilter,
        'classroom.documentType': documentType,
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
        course: {
          $arrayElemAt: ['$course', 0],
        },
        coursePackage: {
          $arrayElemAt: ['$coursePackage', 0],
        },
        schoolSessionOtp: {
          grade: 1,
          section: 1,
          otp: 1,
        },
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
};

const getEventsScheduleAggregation = ({ startDate, endDate, schoolIds }) => [
  {
    $match: {
      startDate: {
        $gte: new Date(moment(startDate).subtract({ days: 1 })),
      },
      endDate: {
        $lte: new Date(moment(endDate).add({ days: 1 })),
      },
      type: 'event',
      'school.typeId': {
        $in: schoolIds || [],
      },
    },
  },
  {
    $project: {
      id: 1,
      eventType: 1,
      type: 1,
      startDate: 1,
      endDate: 1,
      ...getSlotTimeFields(),
      school: 1,
      batch: {
        id: 1,
        school: 1,
        code: 1,
        students: 1,
        classroomTitle: 1,
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
    classroomFilters['classroom.school.typeId'] = {
      $in: get(filters, 'schools'),
    };
  }
  if (get(filters, 'sessionStatus', []).length) {
    sessionFilters.sessionStatus = {
      $in: get(filters, 'sessionStatus', []).map((status) => {
        if (status === 'unattended') {
          return 'allotted';
        }
        return status;
      }),
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

const getSessionStatus = (session) => {
  const sessionStatus = get(session, 'sessionStatus', 'allotted');
  let sessionSlot = 23;
  const currentSlot = new Date().getHours() || 0;
  for (let i = 0; i < 24; i++) {
    if (session[`slot${i}`]) {
      sessionSlot = i;
    }
  }

  if ((get(session, 'topic.classType', 'lab') === 'theory')
    && (
      isBefore(get(session, 'bookingDate'), new Date())
      || (isToday(get(session, 'bookingDate')) && (currentSlot > (sessionSlot + 1)))
    )) {
    return 'completed';
  }
  if ((sessionStatus === 'allotted')
    || ((sessionStatus === 'started') && !get(session, 'sessionStartedByMentorAt'))) {
    /**
     * Checking If allotted session lies before current date.
     */
    if (isBefore(get(session, 'bookingDate'), new Date())) {
      if (isToday(get(session, 'bookingDate'))) {
        const currentMinutes = new Date().getMinutes() || 0;
        if (currentSlot < sessionSlot) {
          return sessionStatus;
        }
        if (currentSlot === sessionSlot) {
          if (currentMinutes <= get(session, 'endMinutes')) return sessionStatus;
        }
      }
      return 'unattended';
    }
    return sessionStatus;
  }
  return sessionStatus;
};

const getTopicOrderOrPackageTopicOrder = (topic, coursePackage, batchSpecificPackageTopicRule) => {
  if (coursePackage && topic) {
    const currentTopicId = get(topic, 'id');
    const packageTopics = get(coursePackage, 'topics', []);
    let packageTopicOrder = get(packageTopics.find((el) => get(el, 'topic.typeId') === currentTopicId), 'order', 0);
    if (batchSpecificPackageTopicRule && batchSpecificPackageTopicRule.length) {
      packageTopicOrder = get(batchSpecificPackageTopicRule.find((el) => get(el, 'topic.typeId') === currentTopicId), 'order', 0);
    }
    if (packageTopicOrder) return packageTopicOrder;
  }
  return get(topic, 'order');
};

const getTopicDocument = (topic, session) => {
  if (!topic) return {};
  const coursePackage = get(session, 'coursePackage', {});
  const batchSpecificPackageTopicRule = get(session, 'classroom.coursePackageTopicRule', []);
  const topicOrder = getTopicOrderOrPackageTopicOrder(topic, coursePackage, batchSpecificPackageTopicRule);
  return {
    ...topic,
    order: topicOrder,
  };
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
        sessionStartedByMentorAt: get(session, 'sessionStartedByMentorAt', null),
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
        topic: getTopicDocument(get(session, 'topic', null), session),
        course: get(session, 'course', null),
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
        sessionStartedByMentorAt: get(session, 'sessionStartedByMentorAt', null),
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
        course: get(session, 'course', null),
        previousTopic: getTopicDocument(get(session, 'previousTopic', null), session),
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

const classroomSessions = (async (root, params, context) => {
  const authentication = ifAuthorized(context);

  if (!(authentication && authentication.app && authentication.user)) {
    throw new UnauthorizedOperationError();
  }

  const filters = get(params, 'filter', null);
  const mentorIds = get(filters, 'userIds');
  const isAdmin = get(filters, 'isAdmin', 'false');
  const documentType = get(filters, 'documentType', 'classroom');
  const startDate = get(filters, 'startDate');
  const endDate = get(filters, 'endDate');
  const schoolIds = get(filters, 'schools', []);

  if ((isAdmin && !schoolIds.length) || (!isAdmin && !mentorIds.length)) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'MentorId or School Id is missing in filter.',
      },
    });
  }
  const batchSessionModel = getTypeQueryController(
    'BatchSession',
    authentication,
  );
  const adhocSessionModel = getTypeQueryController(
    'AdhocSession',
    authentication,
  );
  const timetableScheduleModel = getTypeQueryController(
    'TimetableSchedule',
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
      mentorIds,
      docFilters,
      documentType,
    }),
  );

  const adhocSessionRes = await adhocSessionModel.aggregate(
    getAdhocSessionAggregation({
      startDate,
      endDate,
      mentorIds,
      docFilters,
      documentType,
    }),
  );

  const events = await timetableScheduleModel.aggregate(
    getEventsScheduleAggregation({
      startDate,
      endDate,
      schoolIds,
    }),
  );

  /**
   * Transforming aggregation result into required format i.e ClassroomSessionResult Type
   */
  const transformedClassroomResult = transformMongoResults(
    batchSessionRes,
    adhocSessionRes,
    events,
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

export default classroomSessions;

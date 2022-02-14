import { get, sortBy } from 'lodash';
import { slotTimes } from '../../../../../../constants';
import { UnauthorizedOperationError } from '../../../../../../constants/errors';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';
import { ifAuthorized } from '../../../../../../utils';
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
  batchId,
}) => [
  {
    $match: {
      'batch.typeId': batchId,
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
            topicComponentRule: 1,
            questions: {
              id: 1,
            },
            topicAssignmentQuestions: {
              order: 1,
            },
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
    $project: {
      id: 1,
      bookingDate: 1,
      sessionStartDate: 1,
      sessionEndDate: 1,
      sessionStatus: 1,
      sessionMode: 1,
      sessionRecordingLink: 1,
      topic: {
        $arrayElemAt: ['$topic', 0],
      },
      course: 1,
      attendance: 1,
      ...getSlotTimeFields(),
    },
  },
];

const getAdhocSessionAggregation = ({
  batchId,
}) => [
  {
    $match: {
      'batch.typeId': batchId,
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
      attendance: 1,
      ...getSlotTimeFields(),
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
            topicComponentRule: 1,
            questions: {
              id: 1,
            },
            topicAssignmentQuestions: {
              order: 1,
            },
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
    $project: {
      id: 1,
      bookingDate: 1,
      sessionStartDate: 1,
      sessionEndDate: 1,
      sessionStatus: 1,
      sessionMode: 1,
      type: 1,
      sessionRecordingLink: 1,
      previousTopic: {
        $arrayElemAt: ['$previousTopic', 0],
      },
      course: 1,
      attendance: 1,
      ...getSlotTimeFields(),
    },
  },
];

const getBatchAggregation = ({ batchId }) => [
  {
    $match: {
      id: batchId,
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
      from: 'School',
      localField: 'school.typeId',
      foreignField: 'id',
      as: 'school',
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
          $lookup: {
            from: 'File',
            let: {
              thumbnailId: '$thumbnail.typeId',
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
            as: 'thumbnail',
          },
        },
        {
          $lookup: {
            from: 'Topic',
            localField: 'topics.typeId',
            foreignField: 'id',
            as: 'topics',
          },
        },
        {
          // need to refactor
          $lookup: {
            from: 'File',
            localField: 'topics.thumbnailSmall.typeId',
            foreignField: 'id',
            as: 'topicThumbnailSmall',
          },
        },
        {
          $project: {
            id: 1,
            order: 1,
            title: 1,
            topics: 1,
            description: 1,
            topicThumbnailSmall: 1,
            tools: 1,
            programming: 1,
            theory: 1,
            thumbnail: {
              $arrayElemAt: ['$thumbnail', 0],
            },
          },
        },
      ],
      as: 'course',
    },
  },
  {
    $project: {
      id: 1,
      code: 1,
      classroomTitle: 1,
      description: 1,
      school: {
        $arrayElemAt: ['$school', 0],
      },
      course: {
        $arrayElemAt: ['$course', 0],
      },
      createdAt: 1,
      thumbnailSmall: 1,
      classes: {
        id: 1,
        grade: 1,
        section: 1,
      },
      students: 1,
      documentType: 1,
    },
  },
];

const getTypeQueryController = (
  typeName,
  authentication = {
    bypass: true,
  },
) => new QueryController(typeName, authentication);

const transformMongoResults = (batchSessions, adhocSessions, batch) => {
  const finalResult = [];
  const batchDetail = get(batch, '[0]');
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
        ...getSlotTimeFields(session),
        topic: {
          ...get(session, 'topic', null),
          questionsQuizCount: get(session, 'topic.questions', []).length,
          topicAssignmentQuestionsCount: get(session, 'topic.topicAssignmentQuestions', []).length,
        },
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
        ...getSlotTimeFields(session),
        topic: null,
        previousTopic: {
          ...get(session, 'previousTopic', null),
          questionsQuizCount: get(session, 'previousTopic.questions', []).length,
          topicAssignmentQuestionsCount: get(session, 'previousTopic.topicAssignmentQuestions', []).length,
        },
      });
    });
  }
  const sortedSessions = sortBy(finalResult, ['bookingDate']);
  const topics = get(batchDetail, 'course.topics', []);
  let notConductedTopics = [];
  const topicThumbnailSmalls = get(batchDetail, 'course.topicThumbnailSmall', []);
  topics.forEach((topic) => {
    const addedTopics = sortedSessions.map((session) => (get(session, 'documentType') === 'adhocSession'
      ? get(session, 'previousTopic.id') : get(session, 'topic.id')));
    if (!addedTopics.includes(get(topic, 'id'))) {
      const findThumbnail = topicThumbnailSmalls.find((thumbnail) => get(thumbnail, 'id') === get(topic, 'thumbnailSmall.typeId'));
      // eslint-disable-next-line no-param-reassign
      topic.thumbnailSmall = findThumbnail;
      notConductedTopics.push(topic);
    }
  });
  notConductedTopics = sortBy(notConductedTopics, 'order');
  notConductedTopics.forEach((topic) => {
    finalResult.push({
      bookingDate: null,
      sessionStartDate: null,
      sessionEndDate: null,
      sessionStatus: 'allotted',
      sessionMode: null,
      sessionRecordingLink: null,
      attendance: [],
      sessionType: null,
      id: get(topic, 'id'),
      documentType: 'notYetBooked',
      topic: {
        ...topic,
        questionsQuizCount: get(topic, 'questions', []).length,
        topicAssignmentQuestionsCount: get(topic, 'topicAssignmentQuestions', []).length,
      },
      previousTopic: null,
    });
  });
  const { course } = batchDetail;
  const returnedObj = {
    id: get(batchDetail, 'id'),
    classroomDetail: {
      code: get(batchDetail, 'code'),
      classroomTitle: get(batchDetail, 'classroomTitle', ''),
      description: get(batchDetail, 'description', ''),
      students: get(batchDetail, 'students'),
    },
    sessions: finalResult,
    learingCount: batchSessions ? batchSessions.length : 0,
    revisionCount: adhocSessions ? adhocSessions.filter((session) => get(session, 'type') === 'revision').length : 0,
    testCount: adhocSessions ? adhocSessions.filter((session) => get(session, 'type') === 'assessment').length : 0,
    assignmentCount: 0,
    classroomCourse: {
      id: get(course, 'id'),
      order: get(course, 'order'),
      description: get(course, 'description'),
      thumbnail: get(course, 'thumbnail.uri'),
      title: get(course, 'title'),
      tools: get(batchDetail, 'course.tools', []),
      programming: get(batchDetail, 'course.programming', []),
      theory: get(batchDetail, 'course.theory', []),
    },
    createdAt: get(batchDetail, 'createdAt'),
    batchThumbnail: get(batchDetail, 'thumbnailSmall'),
  };
  return returnedObj;
};

const classroomDetail = (async (root, params, context) => {
  const authentication = ifAuthorized(context);

  if (!(authentication && authentication.app && authentication.user)) {
    throw new UnauthorizedOperationError();
  }
  const batchId = get(params, 'batchId');
  if (!batchId) {
    throw new MissingMandatoryInputInRequestError();
  }

  const batchSessionModel = getTypeQueryController(
    'BatchSession',
    authentication,
  );
  const adhocSessionModel = getTypeQueryController(
    'AdhocSession',
    authentication,
  );
  const batchModel = getTypeQueryController(
    'Batch',
    authentication,
  );

  /**
   * Aggregation Queries for batchSession & adhocSessions
   */
  const batchSessionRes = await batchSessionModel.aggregate(
    getBatchSessionAggregation({
      batchId,
    }),
  );

  const adhocSessionRes = await adhocSessionModel.aggregate(
    getAdhocSessionAggregation({
      batchId,
    }),
  );

  const batchnRes = await batchModel.aggregate(
    getBatchAggregation({
      batchId,
    }),
  );

  const transformedclassroomDetail = transformMongoResults(
    batchSessionRes,
    adhocSessionRes,
    batchnRes,
  );
  return transformedclassroomDetail || {};
});

export default classroomDetail;

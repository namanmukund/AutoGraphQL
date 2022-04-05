/* eslint-disable no-await-in-loop */
import { get } from 'lodash';
import { UnauthorizedOperationError } from '../../../../../../constants/errors';
import { ifAuthorized } from '../../../../../../utils';
import { QueryController } from '../../../controllers';

const getBatchSessionAggregation = ({
  sessionId,
}) => [
  {
    $match: {
      id: sessionId,
    },
  },
  {
    $project: {
      id: 1,
      sessionStatus: 1,
      batch: 1,
      topic: 1,
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
            from: 'StudentProfile',
            localField: 'students.typeId',
            foreignField: 'id',
            as: 'students',
          },
        },
        {
          $project: {
            id: 1,
            classroomTitle: 1,
            students: {
              id: 1,
              user: 1,
            },
          },
        },
      ],
      as: 'classroom',
    },
  },
  {
    $project: {
      id: 1,
      sessionStatus: 1,
      classroom: {
        $arrayElemAt: ['$classroom', 0],
      },
      topic: 1,
    },
  },
];

const mentorMentorMenteeSessionAggregation = (topicId, userIds) => [
  {
    $match: {
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
    $match: {
      'menteeSession.user.id': {
        $in: userIds || [],
      },
    },
  },
  {
    $project: {
      menteeSession: {
        $arrayElemAt: ['$menteeSession', 0],
      },
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
];

const getTypeQueryController = (
  typeName,
  authentication = {
    bypass: true,
  },
) => new QueryController(typeName, authentication);

const getHomeworkCompletedMeta = async (session, model) => {
  const topicId = get(session, 'topic.typeId');
  const userIds = get(session, 'classroom.students', []).map((el) => get(el, 'user.typeId'));
  let homeworkCompletedCount = 0;
  let quizSubmittedCount = 0;
  let assignmentSubmittedCount = 0;
  let practiceSubmittedCount = 0;
  if (topicId && userIds.length) {
    const mmsData = await model.aggregate(mentorMentorMenteeSessionAggregation(topicId, userIds));
    if (mmsData && mmsData.length) {
      const filteredResult = mmsData.filter((el) => get(el, 'isSubmittedForReview') === true);
      const filteredQuizResult = mmsData.filter((el) => get(el, 'isQuizSubmitted') === true);
      const filteredAssignmentResult = mmsData.filter((el) => get(el, 'isAssignmentSubmitted') === true);
      const filteredPracticeResult = mmsData.filter((el) => get(el, 'isPracticeSubmitted') === true);
      homeworkCompletedCount = filteredResult.length || 0;
      quizSubmittedCount = filteredQuizResult.length || 0;
      assignmentSubmittedCount = filteredAssignmentResult.length || 0;
      practiceSubmittedCount = filteredPracticeResult.length || 0;
    }
  }
  return {
    homeworkCompletedCount,
    quizSubmittedCount,
    practiceSubmittedCount,
    assignmentSubmittedCount,
  };
};

const transformMongoResults = async (batchSessions) => {
  const finalResult = [];
  const mentorMenteeSessionModel = getTypeQueryController('MentorMenteeSession');
  if (batchSessions && batchSessions.length) {
    const batchSession = batchSessions[0] || {};
    const homeworkMeta = await getHomeworkCompletedMeta(batchSession, mentorMenteeSessionModel);
    finalResult.push({
      id: get(batchSession, 'id'),
      topicId: get(batchSession, 'topic.typeId', null),
      classroomId: get(batchSession, 'classroom.id', null),
      classroomTitle: get(batchSession, 'classroom.classroomTitle', ''),
      totalStudents: get(batchSession, 'classroom.students', []).length,
      completedHomeworkMeta: get(homeworkMeta, 'homeworkCompletedCount', 0),
      completedQuizMeta: get(homeworkMeta, 'quizSubmittedCount', 0),
      completedAssignmentMeta: get(homeworkMeta, 'assignmentSubmittedCount', 0),
      completedPracticeMeta: get(homeworkMeta, 'practiceSubmittedCount', 0),
      sessionStatus: get(batchSession, 'sessionStatus', 'allotted'),
    });
  }
  return finalResult[0] || {};
};

const getSessionComponentMeta = async (root, params, context) => {
  const authentication = ifAuthorized(context);

  if (!(authentication && authentication.app && authentication.user)) {
    throw new UnauthorizedOperationError();
  }
  const sessionId = get(params, 'sessionId');

  const batchSessionModel = getTypeQueryController(
    'BatchSession',
    authentication,
  );

  /**
  * Aggregation Queries for batchSession
  */
  const batchSessionRes = await batchSessionModel.aggregate(
    getBatchSessionAggregation({
      sessionId,
    }),
  );

  /**
  * Transforming aggregation result into required format i.e ClassroomSessionResult Type
  */
  return transformMongoResults(
    batchSessionRes,
  );
};

export default getSessionComponentMeta;

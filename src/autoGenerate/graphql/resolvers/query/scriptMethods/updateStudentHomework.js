/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import { log } from '../../../../../../utils';
import { QueryController, MutationController } from '../../../controllers';

const getSchoolStudentData = [
  {
    $match: {
      id: 'ckp2j7gsb00000tqngrblcm7p',
    },
  },
  {
    $lookup: {
      from: 'StudentProfile',
      foreignField: 'id',
      localField: 'students.typeId',
      as: 'students',
    },
  },
  {
    $project: {
      id: 1,
      students: 1,
    },
  },
];

const getMentorMenteeSessions = (studentId) => [
  {
    $lookup: {
      from: 'MenteeSession',
      foreignField: 'id',
      localField: 'menteeSession.typeId',
      as: 'menteeSession',
    },
  },
  {
    $lookup: {
      from: 'Topic',
      foreignField: 'id',
      localField: 'topic.typeId',
      as: 'topic',
    },
  },
  {
    $match: {
      'menteeSession.user.typeId': studentId,
    },
  },
  {
    $project: {
      id: 1,
      sessionStatus: 1,
      isQuizSubmitted: 1,
      quizSubmitDate: 1,
      isAssignmentSubmitted: 1,
      assignmentSubmitDate: 1,
      isPracticeSubmitted: 1,
      practiceSubmitDate: 1,
      isSubmittedForReview: 1,
      course: 1,
      menteeSession: {
        $arrayElemAt: ['$menteeSession', 0],
      },
      topic: {
        $arrayElemAt: ['$topic', 0],
      },
    },
  },
  {
    $project: {
      id: 1,
      sessionStatus: 1,
      isQuizSubmitted: 1,
      quizSubmitDate: 1,
      isAssignmentSubmitted: 1,
      assignmentSubmitDate: 1,
      isPracticeSubmitted: 1,
      practiceSubmitDate: 1,
      isSubmittedForReview: 1,
      course: 1,
      menteeSession: {
        id: 1,
        user: {
          id: 1,
          username: 1,
          email: 1,
        },
      },
      topic: {
        id: 1,
        title: 1,
        order: 1,
      },
    },
  },
];

const getUpdateMMsInput = (dataObj = {}) => {
  const dataKey = [
    'isQuizSubmitted',
    'quizSubmitDate',
    'isAssignmentSubmitted',
    'assignmentSubmitDate',
    'isPracticeSubmitted',
    'practiceSubmitDate',
    'isSubmittedForReview'];
  const input = {};
  Object.keys(dataObj).forEach((key) => {
    if (dataKey.includes(key) && dataObj[key]) {
      input[key] = dataObj[key];
    }
  });
  return input;
};

const updateStudentHomework = async () => {
  const newAuthentication = {
    bypass: true,
  };

  const modelQueries = new QueryController('School', newAuthentication);
  const mmsQueryModel = new QueryController('MentorMenteeSession', newAuthentication);
  const mmsMutationModel = new MutationController('MentorMenteeSession', newAuthentication);

  const schoolData = await modelQueries.aggregate(getSchoolStudentData);

  const students = get(schoolData[0], 'students', []);
  log(`Student Count --> ${students && students.length}`);
  if (students && students.length) {
    for (const student of students) {
      log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
      log(`Student ID --> ${get(student, 'user.typeId')}`);
      const mmSessions = await mmsQueryModel.aggregate(getMentorMenteeSessions(get(student, 'user.typeId')));
      log(`Session Count -------> ${mmSessions && mmSessions.length}`);
      const mmSessionsByTopic = {};
      if (mmSessions && mmSessions.length) {
        for (const mmSession of mmSessions) {
          if (mmSessionsByTopic[get(mmSession, 'topic.id')]) {
            mmSessionsByTopic[get(mmSession, 'topic.id')].push(mmSession);
          } else {
            mmSessionsByTopic[get(mmSession, 'topic.id')] = [mmSession];
          }
        }
        const topicIds = Object.keys(mmSessionsByTopic);
        log(`Topic IDS -------> ${topicIds}`);
        for (const topicId of topicIds) {
          log(`Obj Len -------> ${JSON.stringify({
            topicId,
            len: mmSessionsByTopic[topicId].length,
          })}`);
          if (
            topicId
            && mmSessionsByTopic[topicId]
            && mmSessionsByTopic[topicId].length > 1
          ) {
            log('Multiple MentorMenteeSession Found!');
            /**
             * Update Fields in completed session from sessions which are allotted/started
             */
            let updateObject = {};
            let completedSessionId = null;
            for (const session of mmSessionsByTopic[topicId]) {
              updateObject = { ...getUpdateMMsInput(session) };
              if (get(session, 'sessionStatus') === 'completed') {
                completedSessionId = get(session, 'id');
              }
            }
            if (completedSessionId) {
              await mmsMutationModel.update({ id: completedSessionId }, updateObject);
              log(`Update Successful for ${get(student, 'user.typeId')}`);
            }
          }
        }
      }
    }
  }
  return true;
};

export default updateStudentHomework;

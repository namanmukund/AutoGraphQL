import { get } from 'lodash';
import { log } from '../../../../../../utils';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const fetchNpsData = async () => {
  const query = `{
  netPromoterScores(
    filter: {
      or: [{ course_exists: false }, { mentorMenteeSession_exists: false }]
    }
    orderBy: createdAt_ASC
  ) {
    id
    user{
      id
    }
    course {
      id
      title
    }
    mentorMenteeSession {
      id
      topic {
        id
        title
      }
    }
  }
}`;
  const npsData = await callLocalGraphqlApi(query);
  return get(npsData, 'data.netPromoterScores', []);
};

const fetchMentorMenteeSession = async (userIds) => {
  const query = `{
  mentorMenteeSessions(
    filter: {
      and: [
        { menteeSession_some: { user_some: { id_in: [${userIds}] } } }
        { topic_some: { order: 1 } }
      ]
    }
    orderBy:createdAt_ASC
  ) {
    id
    menteeSession {
      id
      user {
        id
      }
    }
    course {
      id
      title
    }
  }
}
`;
  const npsData = await callLocalGraphqlApi(query);
  return get(npsData, 'data.mentorMenteeSessions', []);
};

const updateNpsData = async (npsId, courseConnectId, mentorMenteeSessionConnectId) => {
  const updateQuery = `mutation {
  updateNetPromoterScore(
    id: "${npsId}"
    courseConnectId: "${courseConnectId}"
    mentorMenteeSessionConnectId: "${mentorMenteeSessionConnectId}"
  ) {
    id
  }
}
`;
  const result = await callLocalGraphqlApi(updateQuery);
  return get(result, 'data.updateNetPromoterScore');
};

const updateNetPromoterScoresWithCourseAndMmSession = async () => {
  const npsData = await fetchNpsData();
  if (npsData && npsData.length > 0) {
    let userIds = '';
    npsData.forEach((nps) => { userIds += `"${get(nps, 'user.id')}"`; });
    const mmsData = await fetchMentorMenteeSession(userIds);
    // eslint-disable-next-line no-restricted-syntax
    for (const nps of npsData) {
      if (get(nps, 'user.id')) {
        const mmsOfUser = mmsData.filter((mmSession) => get(mmSession, 'menteeSession.user.id') === get(nps, 'user.id'));
        if (mmsOfUser.length > 0) {
          const npsId = get(nps, 'id');
          const courseConnectId = get(get(mmsOfUser, '[0]'), 'course.id');
          const mentorMenteeSessionConnectId = get(get(mmsOfUser, '[0]'), 'id');
          // eslint-disable-next-line no-await-in-loop
          const updatedNPS = await updateNpsData(npsId, courseConnectId, mentorMenteeSessionConnectId);
          log(`Updated NetPromoterScore: ${get(updatedNPS, 'id')} with course: ${courseConnectId} and mentorMenteeSession: ${mentorMenteeSessionConnectId}`);
        }
      }
    }
  }
};

export default updateNetPromoterScoresWithCourseAndMmSession;

import { get } from 'lodash';
import { ConnectIdRequiredError } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { SimilarDocumentAlreadyExistError } from '../../../../../constants/errors/db';
import { courseToGradeMapping, courseToGradeMappingForStaging } from '../../../../../constants';

const getNetPromoterScoreByAUser = async (userId, courseId, mentorMenteeSessionConnectId, batchSessionConnectId, context) => {
  const query = `
        query{
          netPromoterScores(filter:{
            and: [{ user_some: { id: "${userId}" } }, { course_some: { id: "${courseId}" } }
            ${mentorMenteeSessionConnectId ? `{ mentorMenteeSession_some: { id: "${mentorMenteeSessionConnectId}" } }` : ''}
            ${batchSessionConnectId ? `{ batchSession_some: { id: "${batchSessionConnectId}" } }` : ''}
          ]
          }){
            id
          }
        }`;

  const res = await callLocalGraphqlApi(query, context);
  return get(res, 'data.netPromoterScores');
};

const fetchUserDetails = async (userId, context) => {
  const query = `{
  user(id: "${userId}") {
    id
    studentProfile {
      id
      grade
    }
  }
}
`;
  const result = await callLocalGraphqlApi(query, context);
  return get(result, 'data.user');
};

const addNetPromoterScoreValidation = async (params, mutationOrQueryName, context) => {
  const {
    userConnectId, courseConnectId, mentorMenteeSessionConnectId, batchSessionConnectId,
  } = params;
  if (!userConnectId) {
    throw new ConnectIdRequiredError();
  }
  let courseId = courseConnectId;
  if (!courseConnectId) {
    const userData = await fetchUserDetails(userConnectId, context);
    let grade = get(userData, 'studentProfile.grade', '').replace('Grade', '');
    grade = Number(grade);
    let defaultCourse = courseToGradeMappingForStaging.find((mapping) => mapping.grade.includes(grade));
    if (process.env.NODE_ENV === 'production') {
      defaultCourse = courseToGradeMapping.find((mapping) => mapping.grade.includes(grade));
    }
    Object.assign(params, {
      courseConnectId: get(defaultCourse, 'courseId'),
    });
    courseId = get(defaultCourse, 'courseId');
  }
  const netPromoterScores = await getNetPromoterScoreByAUser(userConnectId, courseId, mentorMenteeSessionConnectId, batchSessionConnectId, context);
  if (netPromoterScores && netPromoterScores.length) {
    throw new SimilarDocumentAlreadyExistError();
  }
};

export default addNetPromoterScoreValidation;

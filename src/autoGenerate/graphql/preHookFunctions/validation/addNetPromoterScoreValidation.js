import { get } from 'lodash';
import { ConnectIdRequiredError } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { SimilarDocumentAlreadyExistError } from '../../../../../constants/errors/db';
import { courseToGradeMapping, courseToGradeMappingForStaging } from '../../../../../constants';

const getNetPromoterScoreByAUser = async (userId, courseId) => {
  const query = `
        query{
          netPromoterScores(filter:{
            and: [{ user_some: { id: "${userId}" } }, { course_some: { id: "${courseId}" } }]
          }){
            id
          }
        }`;

  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.netPromoterScores');
};

const fetchUserDetails = async (userId) => {
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
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.user');
};

const addNetPromoterScoreValidation = async (params) => {
  const { userConnectId, courseConnectId } = params;
  if (!userConnectId) {
    throw new ConnectIdRequiredError();
  }
  let courseId = courseConnectId;
  if (!courseConnectId) {
    const userData = await fetchUserDetails(userConnectId);
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
  const netPromoterScores = await getNetPromoterScoreByAUser(userConnectId, courseId);
  if (netPromoterScores && netPromoterScores.length) {
    throw new SimilarDocumentAlreadyExistError();
  }
};

export default addNetPromoterScoreValidation;

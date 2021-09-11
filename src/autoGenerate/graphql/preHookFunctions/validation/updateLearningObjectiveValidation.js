import { get } from 'lodash';
import { OrderAlreadyExistsError } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { fetchLO } from './addLearningObjectiveValidation';

const fetchCourseForLo = async (loId) => {
  const query = `{
  learningObjective(id: "${loId}") {
    courses {
      id
    }
  }
}
`;
  const loData = await callLocalGraphqlApi(query);
  return get(loData, 'data.learningObjective');
};

const updateLearningObjectiveValidation = async (params) => {
  const { input = {}, id: loId } = params;
  const order = get(input, 'order');
  if (order) {
    const loData = await fetchCourseForLo(loId);
    const courses = get(loData, 'courses', []);
    let courseIds = '';
    courses.forEach((course) => { courseIds += `"${get(course, 'id')}"`; });
    const loDataArray = await fetchLO(courseIds, order, `{ id_not: "${loId}" }`);
    if (loDataArray && loDataArray.length > 0) {
      throw new OrderAlreadyExistsError();
    }
  }
  return true;
};

export default updateLearningObjectiveValidation;

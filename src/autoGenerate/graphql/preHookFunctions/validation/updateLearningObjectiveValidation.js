import { get } from 'lodash';
import { LOWithSimilarTitleAlreadyExist, OrderAlreadyExistsError } from '../../../../../constants/errors';
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
  const title = get(input, 'title');
  if (title || order) {
    const loData = await fetchCourseForLo(loId);
    const courses = get(loData, 'courses', []);
    let courseIds = '';
    courses.forEach((course) => { courseIds += `"${get(course, 'id')}"`; });
    const LoFilter = `{ id_not: "${loId}" }`;
    if (order) {
      const loDataArray = await fetchLO(courseIds, order, null, LoFilter);
      if (loDataArray && loDataArray.length > 0) {
        throw new OrderAlreadyExistsError();
      }
    }
    if (title) {
      const LoData = await fetchLO(courseIds, null, title, LoFilter);
      if (LoData && LoData.length > 0) {
        throw new LOWithSimilarTitleAlreadyExist();
      }
    }
  }
  return true;
};

export default updateLearningObjectiveValidation;

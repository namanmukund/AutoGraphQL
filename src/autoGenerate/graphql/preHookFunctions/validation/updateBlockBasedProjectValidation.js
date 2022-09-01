/* eslint no-restricted-syntax: ["error", "FunctionExpression", "WithStatement",
"BinaryExpression[operator='in']"] */
import { get } from 'lodash';
import {
  ProjectWithSimilarOrderAlreadyExist,
  ProjectWithSimilarTitleAlreadyExist,
} from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { fetchProject } from './addBlockBasedProjectValidation';

const fetchCourseForProject = async (projectId, context) => {
  const query = `{
  blockBasedProject(id: "${projectId}") {
    courses {
      id
    }
  }
}
`;
  const projectData = await callLocalGraphqlApi(query, context);
  return get(projectData, 'data.blockBasedProject');
};

const updateBlockBasedProjectValidation = async (params, mutationOrQueryName, context) => {
  const { input = {}, id: projectId } = params;
  const title = get(input, 'title');
  const order = get(input, 'order');
  const type = get(input, 'type');
  if ((title || order) && type) {
    let courseIds = '';
    const projectData = await fetchCourseForProject(projectId, context);
    const courses = get(projectData, 'courses', []);
    courses.forEach((course) => { courseIds += `"${get(course, 'id')}"`; });
    if (title) {
      const projectDataArray = await fetchProject(courseIds, title, null, type, `{ id_not: "${projectId}" }`);
      if (projectDataArray && projectDataArray.length > 0) {
        throw new ProjectWithSimilarTitleAlreadyExist();
      }
    }
    if (order) {
      const projectDataArray = await fetchProject(courseIds, null, order, type, `{ id_not: "${projectId}" }`);
      if (projectDataArray && projectDataArray.length > 0) {
        throw new ProjectWithSimilarOrderAlreadyExist();
      }
    }
  }
  return true;
};

export default updateBlockBasedProjectValidation;

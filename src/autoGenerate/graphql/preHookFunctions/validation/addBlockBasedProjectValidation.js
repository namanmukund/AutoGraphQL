/* eslint no-restricted-syntax: ["error", "FunctionExpression", "WithStatement",
"BinaryExpression[operator='in']"] */
import { get } from 'lodash';
import {
  ProjectWithSimilarTitleAlreadyExist,
} from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

export const fetchProject = async (courseIds, title, order, type, projectFilter, context) => {
  const query = `{
  blockBasedProjects(
    filter: { and: [
    ${courseIds ? `{ courses_some: { id_in: [${courseIds}] } }` : ''}
    ${title ? `{ title: "${title}" }` : ''}
    ${order ? `{ order: ${order} }` : ''}
    { type: ${type} }
    ${projectFilter || ''}
] }
  ) {
    id
  }
}
`;
  const projectData = await callLocalGraphqlApi(query, context);
  return get(projectData, 'data.blockBasedProjects');
};

const addBlockBasedProjectValidation = async (params, _mutationOrQueryName, context) => {
  const { coursesConnectIds = [], input = {} } = params;
  const title = get(input, 'title');
  const order = get(input, 'order');
  const type = get(input, 'type');
  if ((title || order) && type) {
    let courseIds = '';
    coursesConnectIds.forEach((courseId) => { courseIds += `"${courseId}"`; });
    if (title) {
      const projectDataArray = await fetchProject(courseIds, title, null, type, null, context);
      if (projectDataArray && projectDataArray.length > 0) {
        throw new ProjectWithSimilarTitleAlreadyExist();
      }
    }
    // if (order) {
    //   const projectDataArray = await fetchProject(courseIds, null, order, type);
    //   if (projectDataArray && projectDataArray.length > 0) {
    //     throw new ProjectWithSimilarOrderAlreadyExist();
    //   }
    // }
  }
  return true;
};

export default addBlockBasedProjectValidation;

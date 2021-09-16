import { get } from 'lodash';
import { getFieldsBeingFetched } from '../../../../utils';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { OLD_COURSE_ID } from '../../../../../../constants';
import { InvalidFieldType } from '../../../../../../constants/errors';

const getUserCoursesQuery = (userId) => `
{
  userCourses(filter: { user_some: { id: "${userId}" } }) {
    id
    courses {
      id
      order
      title
      secondaryCategory
      thumbnail {
        id
        uri
      }
      codingLanguages {
        value
      }
      defaultLoComponentRule {
        componentName
        order
      }
      courseComponentRule {
        componentName
        order
      }
      topicsMeta {
        count
      }
      topics {
        id
        title
        description
        videoTitle
        order
        topicComponentRule{
          componentName
          order
          childComponentName
          learningObjective{
              id
              order
              messagesMeta{
                  count
              }
              questionBankMeta(filter:{and:[{assessmentType:practiceQuestion}{status:published}]}){
                  count
              }
              comicStripsMeta(filter:{status:published}){
                  count
              }
          }
          blockBasedProject{
              id
              order
          }
          video{
              id
          }
        }
      }
    }
  }
}
`;

/** Not Required For Now */
// const getUserCourseCompletion = (userId) => `
// {
//   userCourseCompletions(filter: { user_some: { id: "${userId}" } }) {
//     id
//   }
// }
// `;

const validateIncomingFields = (fieldsFetched = {}) => {
  const whiteListedFields = [
    'id', 'title', 'order', 'defaultLoComponentRule', 'codingLanguages',
    'courseComponentRule', 'topicsMeta', 'codingLanguages', 'topics', 'thumbnail', 'secondaryCategory'];

  const fieldsFetchedArr = Object.keys(fieldsFetched);
  if (fieldsFetchedArr && fieldsFetchedArr.length) {
    if (!fieldsFetchedArr.every((field) => whiteListedFields.includes(field))) {
      throw new InvalidFieldType();
    }
  }
};

const getUserCourses = (async (root, params, context, info) => {
  const { input } = params;
  const { fieldNodes } = info;
  const fieldsFetched = getFieldsBeingFetched(fieldNodes);
  await validateIncomingFields(fieldsFetched);

  if (input && get(input, 'userId')) {
    const userId = get(input, 'userId');
    const userCoursesRes = await callLocalGraphqlApi(getUserCoursesQuery(userId));
    const userCourses = get(userCoursesRes, 'data.userCourses[0].courses', []);
    let newPythonCourseExists = false;
    let oldPythonCourseExists = false;
    let updatedCourseArr = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const userCourseDoc of userCourses) {
      if (get(userCourseDoc, 'codingLanguages', []).includes('python') && get(userCourseDoc, 'id') !== OLD_COURSE_ID) {
        newPythonCourseExists = true;
      }
      userCourseDoc.thumbnail = { type: 'File', typeId: `${get(userCourseDoc, 'thumbnail.id')}` };
      if (get(userCourseDoc, 'id') === OLD_COURSE_ID) {
        /** Not Required For Now */
        // eslint-disable-next-line no-await-in-loop
        // const userCourseCompletionRes = await callLocalGraphqlApi(getUserCourseCompletion(userId));
        // const userCourseCompletionId = get(userCourseCompletionRes, 'data.userCourseCompletions[0].id', null);
        // if (userCourseCompletionId) {
        oldPythonCourseExists = true;
        updatedCourseArr.push(userCourseDoc);
        // }
      } else {
        updatedCourseArr.push(userCourseDoc);
      }
    }
    if (newPythonCourseExists && oldPythonCourseExists) {
      updatedCourseArr = updatedCourseArr.filter((course) => get(course, 'id') !== OLD_COURSE_ID);
    }
    return updatedCourseArr || [];
  }
  return [];
});

export default getUserCourses;

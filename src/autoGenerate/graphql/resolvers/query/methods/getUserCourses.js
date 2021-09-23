import { get } from 'lodash';
import { getFieldsBeingFetched } from '../../../../utils';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { OLD_COURSE_ID } from '../../../../../../constants';
import { InvalidFieldType } from '../../../../../../constants/errors';

// query to get current component status of user
const getUserCurrentTopicComponentStatus = (userId, courseId) => `
  query{
    userCurrentTopicComponentStatuses(filter:{
      and:[
        {user_some:{id:"${userId}"}},
        {currentCourse_some:{id: "${courseId}"}}
      ]
    }){
      id
      currentTopic{
        id
        title
        order
        description
        thumbnail{
          id
        }
      }
      user{
        studentProfile{
          school{
            enrollmentType
          }
          batch{
            id
            currentComponent{
              currentCourse{
                id
                order
              }
              currentTopic{
                id
                title
                order
                description
                thumbnail{
                  id
                }
              }
            }
          }
        }
      }
    }
  }
  `;

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
const getUserCourseCompletion = (userId) => `
{
  userCourseCompletions(filter: {
    and:[
      {user_some:{ id: "${userId}"}},
    ]
  }) {
    id
    course {
      id
    }
  }
}
`;

const validateIncomingFields = (fieldsFetched = {}) => {
  const whiteListedFields = ['id', 'title', 'order', 'thumbnail',
    'secondaryCategory', 'currentTopic', 'isCourseCompleted'];

  const fieldsFetchedArr = Object.keys(fieldsFetched);
  if (fieldsFetchedArr && fieldsFetchedArr.length) {
    if (!fieldsFetchedArr.every((field) => whiteListedFields.includes(field))) {
      throw new InvalidFieldType();
    }
  }
};

const getUserCurrentTopic = async (userCourseDoc, userId, context) => {
  let currentTopicInfo = {};
  const res = await callLocalGraphqlApi(
    getUserCurrentTopicComponentStatus(userId, get(userCourseDoc, 'id')),
    context,
    '',
  );
  const currentTopicComponentInfo = get(res, 'data.userCurrentTopicComponentStatuses[0]');
  let batchCurrentComponentInfo = null;
  const batchCurrentComponentCourseId = get(res, 'data.userCurrentTopicComponentStatuses[0].user.studentProfile.batch.currentComponent.currentCourse.id');
  if (batchCurrentComponentCourseId === get(userCourseDoc, 'id')) {
    batchCurrentComponentInfo = get(res, 'data.userCurrentTopicComponentStatuses[0].user.studentProfile.batch.currentComponent');
  }

  if (batchCurrentComponentInfo) {
    currentTopicInfo = get(batchCurrentComponentInfo, 'currentTopic', {});
    if (get(currentTopicInfo, 'thumbnail.id')) {
      currentTopicInfo.thumbnail = { type: 'File', typeId: `${get(currentTopicInfo, 'thumbnail.id')}` };
    }
  } else {
    /* eslint no-lonely-if:0 */
    if (currentTopicComponentInfo) {
      currentTopicInfo = get(currentTopicComponentInfo, 'currentTopic', {});
      if (get(currentTopicInfo, 'thumbnail.id')) {
        currentTopicInfo.thumbnail = { type: 'File', typeId: `${get(currentTopicInfo, 'thumbnail.id')}` };
      }
    }
  }
  return currentTopicInfo || {};
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
    let userCourseCompletions = [];
    if (userCourses && userCourses.length) {
      const userCourseCompletionRes = await callLocalGraphqlApi(getUserCourseCompletion(userId));
      userCourseCompletions = get(userCourseCompletionRes, 'data.userCourseCompletions', []);
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const userCourseDoc of userCourses) {
      userCourseDoc.isCourseCompleted = false;
      /** Checking if Course if Completed */
      const courseCompletion = userCourseCompletions.filter((el) => get(el, 'course.id') === get(userCourseDoc, 'id'));
      if (courseCompletion && courseCompletion.length) {
        userCourseDoc.isCourseCompleted = true;
      }
      /** Getting UserCurrent Component Status for particular course */
      /* eslint no-await-in-loop:0 */
      const currentTopic = await getUserCurrentTopic(userCourseDoc, userId, context);
      if (currentTopic && currentTopic.id) {
        userCourseDoc.currentTopic = { type: 'Topic', typeId: get(currentTopic, 'id') };
      }
      /** Checking if Course is New in Python Segment */
      if (get(userCourseDoc, 'codingLanguages', []).includes('python') && get(userCourseDoc, 'id') !== OLD_COURSE_ID) {
        newPythonCourseExists = true;
      }
      /** Attaching Course Thumbnail */
      if (get(userCourseDoc, 'thumbnail.id')) {
        userCourseDoc.thumbnail = { type: 'File', typeId: `${get(userCourseDoc, 'thumbnail.id')}` };
      }
      /** Checking if It Is OLD Python Course */
      if (get(userCourseDoc, 'id') === OLD_COURSE_ID) {
        /** Not Required For Now */
        // eslint-disable-next-line no-await-in-loop
        // if (userCourseCompletionId) {
        oldPythonCourseExists = true;
        updatedCourseArr.push(userCourseDoc);
        // }
      } else {
        updatedCourseArr.push(userCourseDoc);
      }
    }
    /** Remove OLD Python Course If New One Exists */
    if (newPythonCourseExists && oldPythonCourseExists) {
      updatedCourseArr = updatedCourseArr.filter((course) => get(course, 'id') !== OLD_COURSE_ID);
    }
    return updatedCourseArr;
  }
  return [];
});

export default getUserCourses;

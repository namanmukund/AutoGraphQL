import { get } from 'lodash';
import {
  topicTypes,
  GLOBAL_COURSE_ID,
  operationName, PUBLISHED,
} from '../../../../../../constants';
import { getFieldsBeingFetched } from '../../../../utils';
import {
  DatabaseRecordNotFoundError,
  UnauthenticatedUserError,
} from '../../../../../../constants/errors';
import { validate } from '../../../validation';
import callGraphqlApi from '../../../../../api/callGraphqlApi';
import { ifAuthorized } from '../../../../../../utils';
import isTopicUnlocked from '../../../../utils/isTopicUnlocked';

// query to get current component status of user
const getUserCurrentTopicComponentStatus = async userId => `
  query{
    userCurrentTopicComponentStatuses(filter:{
      and:[
        {user_some:{
        id:"${userId}"
        }},
      {currentCourse_some:{
        and:[
          {status: ${PUBLISHED}},
          {id:"${GLOBAL_COURSE_ID}"}
        ]
      }}
      ]
    }){
      id
      user{
        id
        username
        name
        status
        email
        phone{
          number
          countryCode
        }
        dateOfBirth
        gender
      }
      currentCourse{
        id
        title
        chapters(
            filter: {
              status: ${PUBLISHED}
            }
          ){
          id
          title
          order
          topics(
            filter: {
              status: ${PUBLISHED}
            }
          ){
            id
            title
            order
            isTrial
            thumbnail{
              id
              uri
              name
            }
          }
        }
      }
      currentTopic{
        id
        title
        description
        videoTitle
        order
        thumbnail{
          id
          name
          uri
        }
        description
      }
      currentLearningObjective{
        id
        title
        description
        thumbnail{
          id
          uri
          name
        }
      }
      currentTopicComponentType
      enrollmentType
    }
  }
  `;

/*
This is called when user tries to load homepage
It will return all the chapters and topics
in their locked/unlocked status based on User current topic component status
It also returns the current component(video, chat etc) and related info
*/
const userCourseSyllabusMutationResolver = async (
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  context,
) => {
  const { fieldNodes } = info;
  const feildsFetched = getFieldsBeingFetched(fieldNodes);
  const accessFields = ast[typeName];
  const { authorization: token } = context;
  const authentication = ifAuthorized(context);

  validate(operationName.read, accessFields, feildsFetched, authentication, {});
  const decodedUser = authentication && authentication.user;
  const { id: userId } = decodedUser;
  if (!userId) {
    throw new UnauthenticatedUserError();
  }
  const res = await callGraphqlApi(
    await getUserCurrentTopicComponentStatus(userId),
    '',
    '',
    '',
    token,
  );

  const currentTopicComponentInfo = get(res, 'data.userCurrentTopicComponentStatuses[0]');
  /*
  This case should not occur as we have added logic in prehook userCourseSyllabusMethod
  to add userCurrentTopicComponentStatus if it not already present and
  the first published topic and first published learning objective corresponding to that topic
  will get populated in the document
  */
  if (!currentTopicComponentInfo) {
    throw new DatabaseRecordNotFoundError('UserCurrentTopicComponentStatus: ');
  }
  const {
    user,
    currentCourse,
    currentTopicComponentType: currentTopicComponent,
    currentTopic,
    currentLearningObjective,
    enrollmentType,
  } = currentTopicComponentInfo;
  // throwing errors if some data is missing in User current topic component status
  if (!currentCourse) {
    throw new DatabaseRecordNotFoundError('CurrentCourse: ');
  }
  if (!currentTopicComponent) {
    throw new DatabaseRecordNotFoundError('CurrentTopicComponent: ');
  }
  if (!currentTopic) {
    throw new DatabaseRecordNotFoundError('CurrentTopic: ');
  }
  if (!currentLearningObjective) {
    throw new DatabaseRecordNotFoundError('CurrentLearningObjective: ');
  }
  if (!enrollmentType) {
    throw new DatabaseRecordNotFoundError('EnrollmentType: ');
  }
  if (!user) {
    throw new DatabaseRecordNotFoundError('User: ');
  }
  // this object will be returned in output
  const currentUserSyllabus = {};
  let totalChapters = 0;
  let totalTopics = 0;
  const chapters = currentCourse.chapters;
  const { order: currentTopicOrder } = currentTopic;
  if (!chapters || !chapters.length) {
    throw new DatabaseRecordNotFoundError('CurrentCourse.chapters: ');
  }
  totalChapters += chapters.length;
  // iterating over chapters to construct data for homepage
  chapters.forEach((chapter) => {
    if (!chapter || !chapter.topics || !chapter.topics.length) {
      throw new DatabaseRecordNotFoundError('CurrentCourse.chapter.topics: ');
    }
    totalTopics += chapter.topics.length;
    // iterating over topics of each chapter  and setting isUnlocked field
    chapter.topics.forEach((topic) => {
      const { order: topicOrder, isTrial } = topic;
      // checking logic for is topic Unlocked or not
      const isUnlocked = isTopicUnlocked(enrollmentType, currentTopicOrder, topicOrder, isTrial);
      Object.assign(topic, { isUnlocked });
    });
  });
  Object.assign(currentUserSyllabus, {
    user,
    currentCourse,
    currentTopicComponent,
    chapters,
    totalChapters,
    totalTopics,
  });
  currentUserSyllabus.currentTopicComponentDetail = {};
  let componentTitle;
  let thumbnail;
  let percentageCovered;
  let description;

  const { title: topicTitle,
    videoTitle,
    videoThumbnail,
    thumbnail: topicThumbnail,
    description: topicDescription,
    videoDescription,
  } = currentTopic;
  const {
    title: LOTitle,
    thumbnail: LOThumbnail,
    description: LODescription,
  } = currentLearningObjective;
  const { video, message, practiceQuestion, quiz } = topicTypes;
  // logic for populating current component detail based on current topic component
  switch (currentTopicComponent) {
    case video:
      componentTitle = videoTitle;
      thumbnail = videoThumbnail;
      percentageCovered = 0;
      description = videoDescription;
      break;
    case message:
      componentTitle = LOTitle;
      thumbnail = LOThumbnail;
      percentageCovered = 25;
      description = LODescription;
      break;
    case practiceQuestion:
      componentTitle = LOTitle;
      thumbnail = LOThumbnail;
      percentageCovered = 50;
      description = LODescription;
      break;
    case quiz:
      componentTitle = 'Quiz';
      thumbnail = topicThumbnail;
      percentageCovered = 75;
      description = topicDescription;
      break;
    default:
  }

  Object.assign(currentUserSyllabus.currentTopicComponentDetail,
    { componentTitle, topicTitle, thumbnail, percentageCovered, description });
  return currentUserSyllabus;
};

export default userCourseSyllabusMutationResolver;

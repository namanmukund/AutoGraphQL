import { get } from 'lodash';
import { operationName } from '../../../../../../constants';
import { getFieldsBeingFetched } from '../../../../utils';
import { UnauthenticatedUserError, UnknownUserError } from '../../../../../../constants/errors';
import { validate } from '../../../validation';
import callGraphqlApi from '../../../../../api/callGraphqlApi';
import { ifAuthorized } from '../../../../../../utils';

const getUserCourseSyllabusMutationResolver = async (
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
  if (decodedUser && decodedUser.id) {
    // query to get current compoenent status of user
    const query = `
    query{
      userCurrentComponentStatuses(filter:{
        and:[
          {user_some:{
          id:"${decodedUser.id}"
          }},
        {currentCourse_some:{
          status: published
        }}
        ]
      }){
        id
        user{
          id
          username
          name
        }
        currentCourse{
          title
          chapters{
            title
            order
            topics{
              title
              order
              isFreeForAllUserTypes
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
        currentComponentType
        enrollmentType
      }
    }
    `;

    const res = await callGraphqlApi(
      query,
      '',
      '',
      '',
      token,
    );
    // Ideally each user wull have 1 document in the collection. Fetching the same document
    const currentStatus = get(res, 'data.userCurrentComponentStatuses[0]', null);
    if (currentStatus) {
      const {
        user,
        currentCourse,
        currentComponentType: currentComponent,
        currentTopic,
        currentLearningObjective,
        enrollmentType,
      } = currentStatus;
      // this object will be returned in output
      const currentUserSyllabus = {};
      let chapters;
      if (currentCourse) {
        chapters = currentCourse.chapters;
      }
      if (chapters.length) {
        for (let i = 0; i < chapters.length;) {
          if (chapters[i].topics.length && currentTopic && enrollmentType) {
            for (let j = 0; j < chapters[i].topics.length;) {
              let isUnlocked = false;
              if ((enrollmentType === 'pro' &&
                chapters[i].topics[j].order <= currentTopic.order
              ) || (enrollmentType === 'free' && chapters[i].topics[j].order <= currentTopic.order &&
                chapters[i].topics[j].isFreeForAllUserTypes === true)
              ) {
                isUnlocked = true;
              }
              chapters[i].topics[j].isUnlocked = isUnlocked;
              j += 1;
            }
          }
          i += 1;
        }
      }
      if (user) { currentUserSyllabus.user = user; }
      currentUserSyllabus.currentCourse = {};
      if (currentCourse) {
        currentUserSyllabus.currentCourse.id = currentCourse.id;
        currentUserSyllabus.currentCourse.title = currentCourse.title;
      }
      currentUserSyllabus.currentComponent = currentComponent;
      currentUserSyllabus.chapters = chapters;
      currentUserSyllabus.currentComponentData = {};

      let componentTitle;
      let thumbnail;
      let percentageCovered;
      let description;

      switch (currentComponent) {
        case 'video':
          if (currentTopic) {
            componentTitle = currentTopic.videoTitle;
            thumbnail = currentTopic.videoThumbnail;
            percentageCovered = 0;
            description = currentTopic.videoDescription;
          }
          break;
        case 'chat':
          if (currentLearningObjective) {
            componentTitle = currentLearningObjective.title;
            thumbnail = currentLearningObjective.thumbnail;
            percentageCovered = 25;
            description = currentLearningObjective.description;
          }
          break;
        case 'PQ':
          if (currentLearningObjective) {
            componentTitle = currentLearningObjective.title;
            thumbnail = currentLearningObjective.thumbnail;
            percentageCovered = 50;
            description = currentLearningObjective.description;
          }
          break;
        case 'quiz':
          if (currentTopic) {
            componentTitle = 'Quiz';
            thumbnail = currentTopic.videoThumbnail;
            percentageCovered = 75;
            description = currentTopic.videoDescription;
          }
          break;
        default:
      }

      currentUserSyllabus.currentComponentData.componentTitle = componentTitle;
      if (currentTopic) {
        currentUserSyllabus.currentComponentData.topicTitle = currentTopic.title;
      }
      currentUserSyllabus.currentComponentData.thumbnail = thumbnail;
      currentUserSyllabus.currentComponentData.percentageCovered = percentageCovered;
      currentUserSyllabus.currentComponentData.description = description;

      return currentUserSyllabus;
    }
    throw new UnknownUserError();
  }
  throw new UnauthenticatedUserError();
};

export default getUserCourseSyllabusMutationResolver;

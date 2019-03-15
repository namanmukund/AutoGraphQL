import { get } from 'lodash';
import { operationName } from '../../../../../../constants';
import { getFieldsBeingFetched } from '../../../../utils';
import { UnauthenticatedUserError } from '../../../../../../constants/errors';
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
          id
          title
          chapters{
            id
            title
            order
            topics{
              id
              title
              order
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
    const currentStatus = get(res, 'data.userCurrentComponentStatuses[0]', null);
    const {
      user,
      currentCourse,
      currentComponentType: currentComponent,
      currentTopic,
      currentLearningObjective } = currentStatus;
    const currentUserSyllabus = {};
    const chapters = currentCourse.chapters;
    const modifiedChapters = [];
    for (let i = 0; i < chapters.length;) {
      const chapter = {};
      const topics = [];
      chapter.id = chapters[i].id;
      chapter.title = chapters[i].title;
      chapter.order = chapters[i].order;
      for (let j = 0; j < chapters[i].topics.length;) {
        let topic = {};
        let isUnlocked = false;
        if (chapters[i].topics[j].order <= currentTopic.order) { isUnlocked = true; }
        topic = {
          ...chapters[i].topics[j],
          isUnlocked,
        };
        topics.push({ topic, isUnlocked });
        j += 1;
      }
      modifiedChapters.push({ chapter, topics });
      i += 1;
    }

    currentUserSyllabus.user = user;
    currentUserSyllabus.currentCourse = {};
    currentUserSyllabus.currentCourse.id = currentCourse.id;
    currentUserSyllabus.currentCourse.title = currentCourse.title;
    currentUserSyllabus.currentComponent = currentComponent;
    currentUserSyllabus.chapters = modifiedChapters;
    currentUserSyllabus.currentComponentData = {};

    let componentTitle;
    let thumbnail;
    let percentageCovered;
    let description;

    switch (currentComponent) {
      case 'video':
        componentTitle = currentTopic.videoTitle;
        thumbnail = currentTopic.videoThumbnail;
        percentageCovered = 0;
        description = currentTopic.videoDescription;
        break;
      case 'chat':
        componentTitle = currentLearningObjective.title;
        thumbnail = currentLearningObjective.thumbnail;
        percentageCovered = 25;
        description = currentLearningObjective.description;
        break;
      case 'PQ':
        componentTitle = currentLearningObjective.title;
        thumbnail = currentLearningObjective.thumbnail;
        percentageCovered = 50;
        description = currentLearningObjective.description;
        break;
      case 'quiz':
        componentTitle = 'Quiz';
        thumbnail = currentTopic.videoThumbnail;
        percentageCovered = 75;
        description = currentTopic.videoDescription;
        break;
      default:
    }

    currentUserSyllabus.currentComponentData.componentTitle = componentTitle;
    currentUserSyllabus.currentComponentData.topicTitle = currentTopic.title;
    currentUserSyllabus.currentComponentData.thumbnail = thumbnail;
    currentUserSyllabus.currentComponentData.percentageCovered = percentageCovered;
    currentUserSyllabus.currentComponentData.description = description;

    return currentUserSyllabus;
  }
  throw new UnauthenticatedUserError();
};

export default getUserCourseSyllabusMutationResolver;

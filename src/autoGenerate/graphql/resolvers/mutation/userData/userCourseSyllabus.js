import { get } from 'lodash';
import {
  topicTypes,
  enrollmentTypes,
  GLOBAL_COURSE_ID,
  operationName,
} from '../../../../../../constants';
import { getFieldsBeingFetched } from '../../../../utils';
import { UnauthenticatedUserError, UnknownUserError } from '../../../../../../constants/errors';
import { validate } from '../../../validation';
import callGraphqlApi from '../../../../../api/callGraphqlApi';
import { ifAuthorized } from '../../../../../../utils';

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
  if (userId) {
    // query to get current component status of user
    const query = `
    query{
      userCurrentTopicComponentStatuses(filter:{
        and:[
          {user_some:{
          id:"${userId}"
          }},
        {currentCourse_some:{
          and:[
            {status: published},
            {id:"${GLOBAL_COURSE_ID}"}
            {chapters_some:{
              status: published
            }}
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
          chapters{
            id
            title
            order
            topics{
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

    const res = await callGraphqlApi(
      query,
      '',
      '',
      '',
      token,
    );
    // Ideally each user wull have 1 document in the collection. Fetching the same document
    const currentTopicComponentInfo = get(res, 'data.userCurrentTopicComponentStatuses[0]');
    if (currentTopicComponentInfo) {
      const {
        user,
        currentCourse,
        currentTopicComponentType: currentTopicComponent,
        currentTopic,
        currentLearningObjective,
        enrollmentType,
      } = currentTopicComponentInfo;
      // this object will be returned in output
      const currentUserSyllabus = {};
      let chapters;
      let totalChapters = 0;
      let totalTopics = 0;
      if (currentCourse) {
        chapters = currentCourse.chapters;
      }
      if (chapters.length) {
        totalChapters += chapters.length;
        chapters.forEach((chapter) => {
          if (chapter && chapter.topics &&
            chapter.topics.length &&
            currentTopic &&
            enrollmentType) {
            totalTopics += chapter.topics.length;
            chapter.topics.forEach((topic) => {
              let isUnlocked = false;
              if ((enrollmentType === enrollmentTypes.pro &&
                topic.order <= currentTopic.order
              ) || (enrollmentType === enrollmentTypes.free
                && topic.order <= currentTopic.order &&
                topic.isTrial === true)
              ) {
                isUnlocked = true;
              }
              Object.assign(topic, { isUnlocked });
            });
          }
        });
      }
      if (user) { Object.assign(currentUserSyllabus, { user }); }
      if (currentCourse) {
        Object.assign(currentUserSyllabus, { currentCourse });
      }
      Object.assign(currentUserSyllabus, { currentTopicComponent, chapters });
      Object.assign(currentUserSyllabus, { currentCourse });
      Object.assign(currentUserSyllabus, { totalChapters });
      Object.assign(currentUserSyllabus, { totalTopics });
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
        videoDescription } = currentTopic;
      let LOtitle;
      let LOthumbnail;
      let LOdescription;
      if (currentLearningObjective) {
        LOtitle = currentLearningObjective.title;
        LOthumbnail = currentLearningObjective.thumbnail;
        LOdescription = currentLearningObjective.description;
      }


      switch (currentTopicComponent) {
        case topicTypes.video:
          if (currentTopic) {
            componentTitle = videoTitle;
            thumbnail = videoThumbnail;
            percentageCovered = 0;
            description = videoDescription;
          }
          break;
        case topicTypes.message:
          if (currentLearningObjective) {
            componentTitle = LOtitle;
            thumbnail = LOthumbnail;
            percentageCovered = 25;
            description = LOdescription;
          }
          break;
        case topicTypes.practiceQuestion:
          if (currentLearningObjective) {
            componentTitle = LOtitle;
            thumbnail = LOthumbnail;
            percentageCovered = 50;
            description = LOdescription;
          }
          break;
        case topicTypes.quiz:
          if (currentTopic) {
            componentTitle = 'Quiz';
            thumbnail = topicThumbnail;
            percentageCovered = 75;
            description = topicDescription;
          }
          break;
        default:
      }

      Object.assign(currentUserSyllabus.currentTopicComponentDetail,
        { componentTitle, topicTitle, thumbnail, percentageCovered, description });
      return currentUserSyllabus;
    }
    throw new UnknownUserError();
  }
  throw new UnauthenticatedUserError();
};

export default userCourseSyllabusMutationResolver;

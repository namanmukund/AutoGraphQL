import { get, sortBy } from 'lodash';
import { userActionType, userTopicTypeStatus } from '../../../../constants';
import { log } from '../../../../utils';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import topicComponentRuleQuery from './utils/topicComponentRuleQuery';
import updateCurrentComponentStatusOfNewCourse from './utils/updateCurrentComponentStatusOfNewCourse';

const userLearningObjectiveQuery = (userId, learningObjectiveId, courseId, learningSlideId) => `
  query{
    userLearningObjectives(filter:{
      and:[
        {user_some:{
        id:"${userId}"
        }},
      {learningObjective_some:{
        id:"${learningObjectiveId}"
      }}
      ${courseId ? `{course_some:{id:"${courseId}"}}` : ''}
      ]
    }){
      id
      learningSlideStatus
      learningObjective{
        topic{
          id
          order
          ${topicComponentRuleQuery}
        }
        topics(filter:{and:[
        ${courseId ? `{courses_some:{id:"${courseId}"}}` : ''}
      ]}){
          id
          order
          ${topicComponentRuleQuery}
        }
        learningSlides(orderBy:order_ASC){
          id
          order
        }
        learningSlideData: learningSlides(filter:{id:"${learningSlideId}"}){
          id
          type
        }
      }
    }
  }
  `;

// query to update user LO based on activity done by user
const updateUserLearningObjectiveMutation = (userLearningObjectiveId,
  isLearningSlideBookmarked,
  learningSlideStatus,
  learningSlideId) => `
  mutation{
    updateUserLearningObjective(id:"${userLearningObjectiveId}",  input:{
      learningSlides: {
        updateWith: {
          status: ${learningSlideStatus}
        }
        updateWhere:{
          learningSlideReferenceId: "${learningSlideId}"
        }
      }
    }){
      id
    }
  }
  `;

const addUserActivityPQDumpQuery = (userId, courseId, learningObjectiveId) => `mutation ($input:UserActivityPQDumpInput!){
        addUserActivityPQDump(
          userConnectId: "${userId}"
          learningObjectiveConnectId: "${learningObjectiveId}"
          ${courseId ? `courseConnectId: "${courseId}"` : ''}
          input: $input
        ) {
          id
        }
      }`;

const addUserActivityLearningSlideDumpPostHookMethod = async (input, mutation, context, params) => {
  const userId = get(input, 'user.typeId');
  const learningObjectiveId = get(input, 'learningObjective.typeId');
  const courseId = get(input, 'course.typeId');
  const learningSlideId = get(input, 'learningSlide.typeId');
  if (!userId || !learningObjectiveId || !learningSlideId) {
    log('Either one of userId or learningObjectiveId or learningSlideId is missing in input of addUserActivityPQDumpPostHookMethod');
  }
  const learningObjectiveInfo = get(context, `${mutation}.learningObjective`);
  const topicId = (get(learningObjectiveInfo, 'topics') && get(learningObjectiveInfo, 'topics[0].id')) || get(learningObjectiveInfo, 'topic.id');
  if (!topicId) {
    log('Not able to fetch LearningObjective.topic in addUserActivityPQDumpPostHookMethod');
  }
  const {
    id: learningObjectiveIdInResult,
  } = learningObjectiveInfo;
  if (!learningObjectiveInfo) {
    log('Not able to fetch LearningObjectiveInfo in addUserActivityPQDumpPostHookMethod');
  }
  const userLearningObjectiveQueryRes = await callLocalGraphqlApi(
    userLearningObjectiveQuery(userId, learningObjectiveId, courseId, learningSlideId),
  );
  const userLearningObjectiveInfo = get(userLearningObjectiveQueryRes, 'data.userLearningObjectives[0]');
  const {
    id: userLearningObjectiveId,
    learningSlideStatus: existinglearningSlideStatus,
  } = userLearningObjectiveInfo;
  const learningSlides = get(userLearningObjectiveInfo, 'learningObjective.learningSlides', []);
  const learningSlideData = get(userLearningObjectiveInfo, 'learningObjective.learningSlideData', []);
  const topicComponentRule = get(userLearningObjectiveInfo, 'learningObjective.topics[0].topicComponentRule', null) || get(userLearningObjectiveInfo, 'learningObjective.topic.topicComponentRule', []);
  const topicOrder = get(userLearningObjectiveInfo, 'learningObjective.topics[0].order', null) || get(userLearningObjectiveInfo, 'learningObjective.topic.order');
  const { next, skip } = userActionType;
  const { complete, incomplete, skip: skipStatus } = userTopicTypeStatus;
  let learningSlideStatus = incomplete;
  const { pqAction: userActionValue, isBookmarked } = input;
  const isLastLearningSlide = get(sortBy(learningSlides, 'order', []), `[${learningSlides.length - 1}].id`) === learningSlideId;
  if (userActionValue && userActionValue === next) {
    learningSlideStatus = complete;
  } else if (userActionValue && userActionValue === skip) {
    learningSlideStatus = skipStatus;
  }
  const currentTopicComponentInfo = get(context, `${mutation}.userCurrentTopicComponentStatuses`);
  await updateCurrentComponentStatusOfNewCourse(
    courseId,
    currentTopicComponentInfo,
    learningSlideStatus,
    topicId,
    learningObjectiveIdInResult,
    '',
    '',
    'learningSlide',
    topicComponentRule,
    topicOrder,
    '',
    '',
    isLastLearningSlide,
    learningSlideId,
  );
  // if existing chatStatus is complete, it will remain complete
  if (userLearningObjectiveInfo
      && existinglearningSlideStatus === complete) {
    learningSlideStatus = complete;
  }

  if (!userLearningObjectiveId) {
    log('Not able to fetch LearningObjective.topic in addUserActivityChatDumpPostHookMethod');
  }
  /*
  updating user Learning Objective document on the basis of
  isChatBookmarked, user action(next, back etc) in input
  */
  const learningSlideType = get(learningSlideData, '[0].type');
  if (learningSlideType === 'practiceQuestion' && get(params, 'input.practiceQuestions', []).length) {
    context.fromAddUserLSDump = true;
    await callLocalGraphqlApi(addUserActivityPQDumpQuery(userId, courseId, learningObjectiveId), context, {
      input: {
        pqAction: 'next',
        practiceQuestionsDump: get(params, 'input.practiceQuestions'),
      },
    });
  }
  await callLocalGraphqlApi(updateUserLearningObjectiveMutation(
    userLearningObjectiveId,
    isBookmarked,
    learningSlideStatus,
    learningSlideId,
  ));
  return true;
};

export default addUserActivityLearningSlideDumpPostHookMethod;

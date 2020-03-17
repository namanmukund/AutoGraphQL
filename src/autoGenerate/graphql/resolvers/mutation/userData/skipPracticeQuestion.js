import { get } from 'lodash';
import {
  topicTypes, userActionType, userTopicTypeStatus,
} from '../../../../../../constants';
import {
  DatabaseRecordNotFoundError, UnauthenticatedUserError,
} from '../../../../../../constants/errors';
import getUserIdandAppNameAfterValidation
  from '../../../preHookFunctions/validation/utils/getUserIdandAppNameAfterValidation';
import isComponentUnlocked from '../../../preHookFunctions/validation/utils/isComponentUnlocked';
import { log } from '../../../../../../utils';
import updateCurrentComponentStatus
  from '../../../postHookFunctions/utils/updateCurrentComponentStatus';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { validateMentorMenteePermission } from '../../../preHookFunctions/validation/utils';

/* query to get userLO to check if document exists for userId and learningObjectiveId
also we are doing computation for next component for this */
const userLearningObjectiveQuery = (userId, learningObjectiveId) => `
  query{
    userLearningObjectives(filter:{
      and:[
        {user_some:{
        id:"${userId}"
        }},
      {learningObjective_some:{
        id:"${learningObjectiveId}"
      }}
      ]
    }){
      id
      nextComponent{
        learningObjective{
          id
        }
        nextComponentType
      }
    }
  }
  `;

// mutation to update User Learning Objective
const updateUserLearningObjectiveMutation = (
  userLearningObjectiveId,
  practiceQuestionStatus,
) => `
  mutation{
    updateUserLearningObjective(id:"${userLearningObjectiveId}",  input:{
      practiceQuestionStatus: ${practiceQuestionStatus}
    }){
      id
    }
  }
  `;

/*
This is called when user tries to skip practice question
It will update the userCurrentTopicComponentStatus to message and
update userLearningObjective isSkipped field to true
If sent learning objective is not unlocked, it will return component locked error
If skipped video is already unlocked, it will not update user current component status
*/
const skipPracticeQuestionMutationResolver = async (
  root,
  input,
  typeName,
  info,
  mutationName,
  ast,
  context,
  params,
) => {
  /*
  Calling method to validate token and return userId.
  */
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context, true);

  // check if user has permission to hit API according to his role, if user is mentee and there is
  // no mentor token, he should not be able to hit API
  validateMentorMenteePermission(
    context,
  );

  const { skip } = userActionType;
  const {
    userIdFromContext: userId,
  } = userAndAppInfo;
  const { learningObjectiveId } = params;
  if (!learningObjectiveId) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'learningObjectiveId is not present',
      },
    });
  }

  if (!userId) {
    throw new UnauthenticatedUserError();
  }

  // checking if called lo and user combination is accessible
  const { message } = topicTypes;
  await isComponentUnlocked(
    params,
    mutationName,
    context,
    message,
    userId,
    learningObjectiveId,
  );

  const learningObjectiveInfo = get(context, `${mutationName}.learningObjective`);
  const topicId = get(learningObjectiveInfo, 'topic.id');
  if (!topicId) {
    log('Not able to fetch LearningObjective.topic in addUserActivityPQDumpPostHookMethod');
  }
  const {
    id: learningObjectiveIdInResult,
  } = learningObjectiveInfo;
  /*
  we are getting userLearningObjective for below purpose:
  -we get userLearningObjective id , which will be used further to update the document
  -we get next component from the document and update user current topic component status with same
  */
  const userLearningObjectiveQueryRes = await callLocalGraphqlApi(
    userLearningObjectiveQuery(userId, learningObjectiveId),
    context,
    '',
  );
  const userLearningObjectiveInfo = get(userLearningObjectiveQueryRes, 'data.userLearningObjectives[0]');
  const {
    id: userLearningObjectiveId,
  } = userLearningObjectiveInfo;
  /*
  Getting data for user current topic component status from context based on mutationName
  This will be used to cover the case that current component status will only get changed, if
  called component is equal to current component and user has just consumed(next action) it
  And current component status will not get changed when it is already consumed in past
  */
  const currentTopicComponentInfo = get(context, `${mutationName}.userCurrentTopicComponentStatuses`);
  /*
  For next user component topic status, we are using next component stored
  in userLearningObjective document when it was created. Next component here can
  either be chat of next Lo or quiz. Logic for this is already written when
  userLearningObjective document gets created
  */
  const nextComponentLearningObjectiveId = get(userLearningObjectiveInfo, 'nextComponent.learningObjective.id');
  const nextComponentType = get(userLearningObjectiveInfo, 'nextComponent.nextComponentType');
  /*
  Calling method to update current user Topic Component status
  */
  await updateCurrentComponentStatus(
    currentTopicComponentInfo,
    skip,
    topicId,
    learningObjectiveIdInResult,
    'practiceQuestion',
    nextComponentType,
    '',
    '',
    nextComponentLearningObjectiveId,
  );
  const { skip: skipStatus } = userTopicTypeStatus;
  // updating isSkipped field to true if user skips practice question
  await callLocalGraphqlApi(
    updateUserLearningObjectiveMutation(
      userLearningObjectiveId,
      skipStatus,
    ),
    context,
    '',
  );

  return {
    result: true,
  };
};

export default skipPracticeQuestionMutationResolver;

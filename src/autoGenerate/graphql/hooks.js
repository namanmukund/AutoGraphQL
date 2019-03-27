import { get, isArray } from 'lodash';
import { functions, ifAuthorized } from '../../../utils';


import {
  validateLogin, validateExistingUserInput,
  preUserDataValidation,
  validateAppTokenInput,
  isFileDeleteAllowed,
  getUserData,
  validateForgotPassword,
  addUserValidation,
  deleteChapterValidation,
} from './validation';
import {
  UserAlreadyExistsError,
  UnauthorizedOperationError,
  BlockedOperationError,
  UserPasswordNotSetError,
  DatabaseRecordNotFoundError,
  UserPasswordAlreadySetError,
  AlreadyActiveUser,
  EitherPhoneOrEmailOtpRequiredError,
  FileUsageCountNotZeroError,
  ComponentLockedError,
  RelationValuesExistError,
  InvalidTopicLOConnectionError,
  InvalidTopicPassedInCurrentComponent,
}
  from '../../../constants/errors';
import {
  BYPASS,
  enrollmentTypes,
  GLOBAL_COURSE_ID,
  userActionType,
  userComponentStatus,
  componentTypes, PUBLISHED,
} from '../../../constants';

import { createStaticAppToken } from '../../auth';
import deleteFromS3 from '../../middlewares/utils/deleteFromS3';
import { callAddUpdateHookValidationFunction } from './preHookFunctions/validation/utils';
import deleteTopicValidation from './preHookFunctions/validation/deleteTopicValidation';
import deleteLearningObjectiveValidation from './preHookFunctions/validation/deleteLearningObjectiveValidation';
import deleteQuestionBankValidation from './preHookFunctions/validation/deleteQuestionBankValidation';
import callGraphqlApi from '../../api/callGraphqlApi';
import { log } from '../../../utils/log';

const { hookFunctions } = functions || {};

const hook = (data, mutationName, hookName) => {
  if (!data) {
    return data;
  }
  let newData = data;
  const arrayName = `${mutationName}${hookName}`;
  if (hookFunctions && isArray(hookFunctions[arrayName])) {
    const loopArray = hookFunctions[arrayName];
    loopArray.map((fn) => {
      newData = fn(newData);

      return null;
    });
  }
  return newData;
};

// use context to pass data b/w functions
// validationObject, record, hookValidationsCalled, fetchedData

// This hook is used to transform input argument for a mutation.
// params contain all the arguments whatever you are passing in mutation query
const prehook = async (input, mutationOrQueryName, context, params) => {
  console.log('-----------------1111111mutationOrQueryName', mutationOrQueryName);
  switch (mutationOrQueryName) {
    case 'addUserCurrentComponentStatus' : {
      console.log('-------------------------addUserCurrentComponentStatus params', params);
      const userId = get(params, 'userConnectId');
      const courseId = get(params, 'currentCourseConnectId');
      const topicId = get(params, 'currentTopicConnectId');
      const learningObjectiveId = get(params, 'currentLearningObjectiveConnectId');
      console.log('-------------------------userId params', userId);
      console.log('-------------------------courseId params', courseId);
      if (userId && courseId) {
        const userCurrentComponentStatusQuery = `
          query{
            userCurrentComponentStatuses(filter:{
              and:[
                {user_some:{
                id:"${userId}"
                }},
              {currentCourse_some:{
                  id:"${courseId}"
              }}
              ]
            }){
              id
            }
          }
        `;
        console.log('-------------------------userCurrentComponentStatusQuery', userCurrentComponentStatusQuery);
        const userCurrentComponentStatusData = await callGraphqlApi(
          userCurrentComponentStatusQuery);
        console.log('---------------------------- userCurrentComponentStatusData', userCurrentComponentStatusData);
        const userCurrentComponentStatusesResult = get(
          userCurrentComponentStatusData,
          'data.userCurrentComponentStatuses');
        if (userCurrentComponentStatusesResult && userCurrentComponentStatusesResult.length) {
          throw new RelationValuesExistError();
        }
        if (topicId && learningObjectiveId) {
          const learningObjectiveQuery = `
          query{
            learningObjective(id:"${learningObjectiveId}"){
              id
              order
              topic{
                id
                order
                isTrial
              }
            }
          }
          `;
          console.log('-------------------------learningObjectiveQuery', learningObjectiveQuery);
          const learningObjectiveData = await callGraphqlApi(
            learningObjectiveQuery);
          console.log('---------------------------- learningObjectiveData', learningObjectiveData);
          const topicIdConnectedToLO = get(
            learningObjectiveData,
            'data.learningObjective.topic.id');
          if (topicIdConnectedToLO && topicIdConnectedToLO !== topicId) {
            throw new InvalidTopicLOConnectionError();
          }
        }
      }
      break;
    }
    case 'updateUserCurrentComponentStatus' : {
      console.log('-------------------------updateUserCurrentComponentStatus params', params);
      const userCurrentComponentStatusId = get(params, 'id');
      const topicId = get(params, 'currentTopicConnectId');
      // const learningObjectiveId = get(params, 'currentLearningObjectiveConnectId');
      if (userCurrentComponentStatusId && topicId) {
        const topicQuery = `
          query{
            topic(id:"${topicId}"){
              id
              order
            }
          }
          `;
        const topicData = await callGraphqlApi(
          topicQuery);
        const topicOrder = get(
          topicData,
          'data.topic.order');

        const userCurrentComponentStatusQuery = `
          query{
            userCurrentComponentStatus(id:"${userCurrentComponentStatusId}"){
              id
              currentTopic{
                id
                title
                order
              }
            }
          }
        `;
        console.log('-------------------------userCurrentComponentStatusQuery', userCurrentComponentStatusQuery);
        const userCurrentComponentStatusData = await callGraphqlApi(
          userCurrentComponentStatusQuery);
        console.log('---------------------------- userCurrentComponentStatusData', userCurrentComponentStatusData);
        const userCurrentComponentTopicOrder = get(
          userCurrentComponentStatusData,
          'data.userCurrentComponentStatus.currentTopic.order');
        if (userCurrentComponentTopicOrder &&
          topicOrder &&
          topicOrder <= userCurrentComponentTopicOrder) {
          throw new InvalidTopicPassedInCurrentComponent();
        }
      }
      break;
    }
    case 'userCourseSyllabus' : {
      const query = `
        query{
          topics(filter:{
            and:[
              {order:1},
              {status: ${PUBLISHED} }
            ]
          }){
            id
          }
        }
        `;
      const topic = await callGraphqlApi(query);
      const firstTopicId = get(topic, 'data.topics[0].id');
      const authentication = ifAuthorized(context);
      const decodedUser = authentication && authentication.user;
      const { id: userId } = decodedUser;
      // mutation to create current component status of user
      const mutation = `
      mutation{
        addUserCurrentComponentStatus(
          input: {
            enrollmentType: ${enrollmentTypes.free}
            currentComponentType: ${componentTypes.video}
          }
          userConnectId:"${userId}"
          currentCourseConnectId:"${GLOBAL_COURSE_ID}"
          currentTopicConnectId:"${firstTopicId}"
        ){
          id
          currentCourse{
            title
            chaptersMeta{
              count
            }
            chapters{
              topicsMeta{
                count
              }
            }
          }
          currentTopic{
            id
            title
            description
            thumbnail{
              id
              name
              uri
            }
            description
          }
          currentComponentType
        }
      }
    `;
      await callGraphqlApi(mutation);
      break;
    }
    case 'addUserActivityVideoDump' : {
      // check if the called user and topic is unlocked
      const userId = get(params, 'userConnectId');
      const topicId = get(params, 'topicConnectId');
      if (userId && topicId) {
        const topicQuery = `
          query{
            topic(id:"${topicId}"){
              id
              order
              learningObjectives(filter:{
                order: 1
              }){
                id
              }
            }
          }
          `;
        const topicQueryRes = await callGraphqlApi(topicQuery);
        const topicInfo = get(topicQueryRes, 'data.topic');

        // query to get current component status of user
        const userCurrentComponentStatusQuery = `
          query{
            userCurrentComponentStatuses(filter:{
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
              }
              currentTopic{
                id
                order
              }
              currentComponentType
              enrollmentType
            }
          }
          `;
        const userCurrentComponentStatusRes = await callGraphqlApi(userCurrentComponentStatusQuery);
        const currentComponentInfo = get(userCurrentComponentStatusRes, 'data.userCurrentComponentStatuses[0]');

        if (topicInfo && currentComponentInfo) {
          let isUnlocked = false;
          const {
            order,
            isTrial,
          } = topicInfo;
          const {
            currentTopic,
            enrollmentType,
          } = currentComponentInfo;
          if ((enrollmentType === enrollmentTypes.pro &&
            order <= currentTopic.order
          ) || (enrollmentType === enrollmentTypes.free
            && order <= currentTopic.order &&
            isTrial === true)
          ) {
            isUnlocked = true;
          }
          console.log('-----------------locked or unlocked', mutationOrQueryName);
          if (!isUnlocked) throw new ComponentLockedError();
        }
      }
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'addUserActivityChatDump' : {
      // check if the called user and topic is unlocked
      const userId = get(params, 'userConnectId');
      const learningObjectiveId = get(params, 'learningObjectiveConnectId');
      if (userId && learningObjectiveId) {
        const learningObjectiveQuery = `
          query{
            learningObjective(id:"${learningObjectiveId}"){
              id
              order
              topic{
                id
                order
                isTrial
              }
            }
          }
          `;
        const learningObjectiveQueryRes = await callGraphqlApi(learningObjectiveQuery);
        const learningObjectiveInfo = get(learningObjectiveQueryRes, 'data.learningObjective');
        console.log('-----------------1111111', JSON.stringify(learningObjectiveInfo));
        const topicInfo = get(learningObjectiveInfo, 'topic');
        // const topicId = get(topicInfo, 'id');
        const learningObjectiveOrder = get(learningObjectiveInfo, 'order');
        // query to get current component status of user
        const userCurrentComponentStatusQuery = `
          query{
            userCurrentComponentStatuses(filter:{
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
              }
              currentTopic{
                id
                order
              }
              currentLearningObjective{
                id
                order
              }
              currentComponentType
              enrollmentType
            }
          }
          `;
        const userCurrentComponentStatusRes = await callGraphqlApi(userCurrentComponentStatusQuery);
        const currentComponentInfo = get(userCurrentComponentStatusRes, 'data.userCurrentComponentStatuses[0]');
        console.log('-----------------1111111currentComponentInfo', JSON.stringify(currentComponentInfo));
        if (learningObjectiveInfo && topicInfo && currentComponentInfo) {
          let isUnlocked = false;
          const {
            order: topicOrder,
            isTrial,
          } = topicInfo;
          const {
            currentTopic,
            currentLearningObjective,
            currentComponentType,
            enrollmentType,
          } = currentComponentInfo;
          if ((enrollmentType === enrollmentTypes.pro &&
            topicOrder <= currentTopic.order
          ) || (enrollmentType === enrollmentTypes.free
            && topicOrder <= currentTopic.order &&
            isTrial === true)) {
            if (topicOrder < currentTopic.order ||
              (currentComponentType === componentTypes.quiz) ||
              (currentComponentType !== componentTypes.video &&
                learningObjectiveOrder <= currentLearningObjective.order)) {
              isUnlocked = true;
            }
          }
          console.log('-----------------1111111isUnlocked', isUnlocked);
          if (!isUnlocked) throw new ComponentLockedError();
        }
      }
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'addUserActivityPQDump' : {
      // check if the called user and topic is unlocked
      const userId = get(params, 'userConnectId');
      const learningObjectiveId = get(params, 'learningObjectiveConnectId');
      if (userId && learningObjectiveId) {
        const learningObjectiveQuery = `
          query{
            learningObjective(id:"${learningObjectiveId}"){
              id
              order
              topic{
                id
                order
                isTrial
                learningObjectives{
                  id
                  order
                }
              }
              questionBank(filter:{assessmentType:${componentTypes.practiceQuestion}}){
                id
              }
            }
          }
          `;
        const learningObjectiveQueryRes = await callGraphqlApi(learningObjectiveQuery);
        const learningObjectiveInfo = get(learningObjectiveQueryRes, 'data.learningObjective');
        console.log('-----------------1111111', JSON.stringify(learningObjectiveInfo));
        const topicInfo = get(learningObjectiveInfo, 'topic');
        // const topicId = get(topicInfo, 'id');
        const learningObjectiveOrder = get(learningObjectiveInfo, 'order');
        // query to get current component status of user
        const userCurrentComponentStatusQuery = `
          query{
            userCurrentComponentStatuses(filter:{
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
              }
              currentTopic{
                id
                order
              }
              currentLearningObjective{
                id
                order
              }
              currentComponentType
              enrollmentType
            }
          }
          `;
        const userCurrentComponentStatusRes = await callGraphqlApi(userCurrentComponentStatusQuery);
        const currentComponentInfo = get(userCurrentComponentStatusRes, 'data.userCurrentComponentStatuses[0]');
        console.log('-----------------1111111currentComponentInfo', JSON.stringify(currentComponentInfo));
        if (learningObjectiveInfo && topicInfo && currentComponentInfo) {
          let isUnlocked = false;
          const {
            order: topicOrder,
            isTrial,
          } = topicInfo;
          const {
            currentTopic,
            currentLearningObjective,
            currentComponentType,
            enrollmentType,
          } = currentComponentInfo;
          if ((enrollmentType === enrollmentTypes.pro &&
            topicOrder <= currentTopic.order
          ) || (enrollmentType === enrollmentTypes.free
            && topicOrder <= currentTopic.order &&
            isTrial === true)) {
            if (topicOrder < currentTopic.order ||
              (currentComponentType === componentTypes.quiz) ||
              (currentComponentType !== componentTypes.video &&
                learningObjectiveOrder < currentLearningObjective.order) ||
              (currentComponentType === componentTypes.practiceQuestion &&
                learningObjectiveOrder === currentLearningObjective.order)) {
              isUnlocked = true;
            }
          }
          console.log('-----------------1111111isUnlocked', isUnlocked);
          if (!isUnlocked) throw new ComponentLockedError();
        }
      }
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'addUserActivityQuizDump' : {
      // check if the called user and topic is unlocked
      const userId = get(params, 'userConnectId');
      const topicId = get(params, 'topicConnectId');
      console.log('-----------------------------userId', userId);
      console.log('-----------------------------topicId', topicId);
      if (userId && topicId) {
        const topicQuery = `
          query{
            topic(id:"${topicId}"){
              id
              order
              learningObjectives(filter:{
                order: 1
              }){
                id
              }
            }
          }
          `;
        const topicQueryRes = await callGraphqlApi(topicQuery);
        const topicInfo = get(topicQueryRes, 'data.topic');
        // query to get current component status of user
        const userCurrentComponentStatusQuery = `
          query{
            userCurrentComponentStatuses(filter:{
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
              }
              currentTopic{
                id
                order
              }
              currentLearningObjective{
                id
                order
              }
              currentComponentType
              enrollmentType
            }
          }
          `;
        const userCurrentComponentStatusRes = await callGraphqlApi(userCurrentComponentStatusQuery);
        const currentComponentInfo = get(userCurrentComponentStatusRes, 'data.userCurrentComponentStatuses[0]');
        console.log('-----------------1111111currentComponentInfo', JSON.stringify(currentComponentInfo));
        console.log('-----------------1111111currenttopicInfo', JSON.stringify(topicInfo));
        if (topicInfo && currentComponentInfo) {
          let isUnlocked = false;
          const {
            order: topicOrder,
            isTrial,
          } = topicInfo;
          const {
            currentTopic,
            currentComponentType,
            enrollmentType,
          } = currentComponentInfo;
          if ((enrollmentType === enrollmentTypes.pro &&
            topicOrder <= currentTopic.order
          ) || (enrollmentType === enrollmentTypes.free
            && topicOrder <= currentTopic.order &&
            isTrial === true)) {
            if (topicOrder < currentTopic.order ||
              (currentComponentType === componentTypes.quiz)) {
              isUnlocked = true;
            }
          }
          console.log('-----------------1111111isUnlocked', isUnlocked);
          if (!isUnlocked) throw new ComponentLockedError();
        }
      }
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'userVideo' : {
      const filterArray = get(params, 'filter.and');
      const userSome = filterArray.find(obj => obj.user_some);
      const topicSome = filterArray.find(obj => obj.topic_some);
      const userId = get(userSome, 'user_some.id');
      const topicId = get(topicSome, 'topic_some.id');
      if (userId && topicId) {
        const topicQuery = `
          query{
            topic(id:"${topicId}"){
              id
              order
              learningObjectives(filter:{
                order: 1
              }){
                id
              }
            }
          }
          `;
        const topicQueryRes = await callGraphqlApi(topicQuery);
        const topicInfo = get(topicQueryRes, 'data.topic');

        // query to get current component status of user
        const userCurrentComponentStatusQuery = `
          query{
            userCurrentComponentStatuses(filter:{
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
              }
              currentTopic{
                id
                order
              }
              currentComponentType
              enrollmentType
            }
          }
          `;
        const userCurrentComponentStatusRes = await callGraphqlApi(userCurrentComponentStatusQuery);
        const currentComponentInfo = get(userCurrentComponentStatusRes, 'data.userCurrentComponentStatuses[0]');

        if (topicInfo && currentComponentInfo) {
          let isUnlocked = false;
          const {
            order,
            isTrial,
          } = topicInfo;
          const {
            currentTopic,
            enrollmentType,
          } = currentComponentInfo;
          if ((enrollmentType === enrollmentTypes.pro &&
            order <= currentTopic.order
          ) || (enrollmentType === enrollmentTypes.free
            && order <= currentTopic.order &&
            isTrial === true)
          ) {
            isUnlocked = true;
          }
          console.log('-----------------locked or unlocked', mutationOrQueryName);
          if (!isUnlocked) throw new ComponentLockedError();
        }
      }
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'userLo' : {
      const filterArray = get(params, 'filter.and');
      console.log('-----------------------------------filterArray', JSON.stringify(filterArray));
      const userSome = filterArray.find(obj => obj.user_some);
      const loSome = filterArray.find(obj => obj.learningObjective_some);
      console.log('-----------------------------------userSome', userSome);
      console.log('-----------------------------------loSome', loSome);
      const userId = get(userSome, 'user_some.id');
      const learningObjectiveId = get(loSome, 'learningObjective_some.id');
      if (userId && learningObjectiveId) {
        const learningObjectiveQuery = `
          query{
            learningObjective(id:"${learningObjectiveId}"){
              id
              order
              topic{
                id
                order
                isTrial
              }
            }
          }
          `;
        const learningObjectiveQueryRes = await callGraphqlApi(learningObjectiveQuery);
        const learningObjectiveInfo = get(learningObjectiveQueryRes, 'data.learningObjective');
        console.log('-----------------1111111', JSON.stringify(learningObjectiveInfo));
        const topicInfo = get(learningObjectiveInfo, 'topic');
        // const topicId = get(topicInfo, 'id');
        const learningObjectiveOrder = get(learningObjectiveInfo, 'order');
        // query to get current component status of user
        const userCurrentComponentStatusQuery = `
          query{
            userCurrentComponentStatuses(filter:{
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
              }
              currentTopic{
                id
                order
              }
              currentLearningObjective{
                id
                order
              }
              currentComponentType
              enrollmentType
            }
          }
          `;
        const userCurrentComponentStatusRes = await callGraphqlApi(userCurrentComponentStatusQuery);
        const currentComponentInfo = get(userCurrentComponentStatusRes, 'data.userCurrentComponentStatuses[0]');
        console.log('-----------------1111111currentComponentInfo', JSON.stringify(currentComponentInfo));
        if (learningObjectiveInfo && topicInfo && currentComponentInfo) {
          let isUnlocked = false;
          const {
            order: topicOrder,
            isTrial,
          } = topicInfo;
          const {
            currentTopic,
            currentLearningObjective,
            currentComponentType,
            enrollmentType,
          } = currentComponentInfo;
          if ((enrollmentType === enrollmentTypes.pro &&
            topicOrder <= currentTopic.order
          ) || (enrollmentType === enrollmentTypes.free
            && topicOrder <= currentTopic.order &&
            isTrial === true)) {
            if (topicOrder < currentTopic.order ||
              (currentComponentType === componentTypes.quiz) ||
              (currentComponentType !== componentTypes.video &&
                learningObjectiveOrder <= currentLearningObjective.order)) {
              isUnlocked = true;
            }
          }
          console.log('-----------------1111111isUnlocked', isUnlocked);
          if (!isUnlocked) throw new ComponentLockedError();
        }
      }
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'addUser' : {
      // validate username, phone, email and name and returns email or phone verified accordingly
      const verifiedData = await addUserValidation(input);
      Object.assign(input, verifiedData);
      return preUserDataValidation(input, mutationOrQueryName).then((userData) => {
        if (userData) {
          throw new UserAlreadyExistsError();
        }
        return hook(input, mutationOrQueryName, 'PreHook');
      });
    }
    case 'setUserPassword' : {
      return preUserDataValidation(input, mutationOrQueryName).then((userData) => {
        if (!userData) {
          throw new DatabaseRecordNotFoundError();
        }

        // Only user with active and inactive status are allowed to set their password
        const { status, isSetPassword } = userData;
        switch (status) {
          case 'blocked':
            throw new BlockedOperationError();
          default:
        }

        if (isSetPassword) {
          throw new UserPasswordAlreadySetError();
        }
        return hook(input, mutationOrQueryName, 'PreHook');
      });
    }
    case 'resetUserPassword' : {
      return preUserDataValidation(input, mutationOrQueryName).then((userData) => {
        if (!userData) {
          throw new DatabaseRecordNotFoundError();
        }
        const { status, isSetPassword } = userData;

        // Only user with active and inactive status are allowed to reset their password
        switch (status) {
          case 'blocked':
            throw new BlockedOperationError();
          default:
        }

        if (!isSetPassword) {
          throw new UserPasswordNotSetError();
        }
        Object.assign(input, {
          password: userData.password,
        });
        return hook(input, mutationOrQueryName, 'PreHook');
      });
    }
    case 'tcirtSdrowssaPtes': {
      return preUserDataValidation(input, mutationOrQueryName).then((userData) => {
        if (!userData) {
          throw new DatabaseRecordNotFoundError();
        }
        const { status } = userData;

        // Only user with active and inactive status are allowed to set/reset their password
        switch (status) {
          case 'blocked':
            throw new BlockedOperationError();
          default:
        }

        return hook(input, mutationOrQueryName, 'PreHook');
      });
    }
    case 'signupExistingUser' : {
      return new Promise((resolve) => {
        const verifiedData = validateExistingUserInput(input);
        Object.assign(input, verifiedData);
        resolve(hook(input, mutationOrQueryName, 'PreHook'));
      });
    }
    case 'login' : {
      // validates email or phone number
      const verifiedData = validateLogin(input);
      Object.assign(input, verifiedData);

      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'updateUser' : {
      await callAddUpdateHookValidationFunction(mutationOrQueryName, params, context);
      break;
    }

    case 'validateUserOTP' :
    {
      const { phoneOtp, emailOtp } = input;
      if (!phoneOtp && !emailOtp) {
        throw new EitherPhoneOrEmailOtpRequiredError();
      }
      const { decodedUser } = context;
      const { status, id } = decodedUser;
      switch (status) {
        case 'active': {
          return getUserData(id).then((res) => {
            if (!res) {
              throw new DatabaseRecordNotFoundError();
            }
            const { emailVerified, phoneVerified } = res;

            /* Active only when either email or phone is verified for
            validateUserOtp
            */
            if ((phoneOtp && phoneVerified) || (emailOtp && emailVerified)) {
              throw new AlreadyActiveUser();
            }
            return hook(input, mutationOrQueryName, 'PreHook');
          });
        }
        case 'blocked':
          throw new UnauthorizedOperationError();
        case 'inactive': {
          Object.assign(input, { status: BYPASS });
          return hook(input, mutationOrQueryName, 'PreHook');
        }
        default:
      }
      break;
    }
    case 'resendUserOTP': {
      const { decodedUser } = context;
      const { status } = decodedUser;
      switch (status) {
        case 'active':
          throw new AlreadyActiveUser();
        case 'blocked':
          throw new UnauthorizedOperationError();
        case 'inactive': {
          Object.assign(input, { status: BYPASS });
          return hook(input, mutationOrQueryName, 'PreHook');
        }
        default:
      }
      break;
    }
    /* eslint-enable no-fallthrough */
    case 'finishForgotPassword':
    case 'validateForgotPasswordOTP':
    case 'resendForgotPasswordOTP':
    case 'sendForgotPasswordOTP': {
      const newInput = validateForgotPassword(input);
      return hook(newInput, mutationOrQueryName, 'PreHook');
    }
    case 'addAppToken': {
      const { decodedUser } = context;
      const authentication = ifAuthorized(context);

      const { name, type } = input;
      if (decodedUser) {
        const { status } = decodedUser;
        if (status && status !== 'active') {
          throw new UnauthorizedOperationError();
        }
      }

      return validateAppTokenInput(input, authentication).then(() => {
        Object.assign(input, {
          token: createStaticAppToken(name, type),
        });
        return hook(input, mutationOrQueryName, 'PreHook');
      });
    }
    case 'deleteFile' : {
      return isFileDeleteAllowed(params).then((res) => {
        if (!res) {
          throw new FileUsageCountNotZeroError();
        }
        return hook(input, mutationOrQueryName, 'PreHook');
      });
    }
    case 'deleteChapter' : {
      await deleteChapterValidation(params);
      break;
    }
    case 'deleteTopic' : {
      await deleteTopicValidation(params);
      break;
    }
    case 'deleteLearningObjective' : {
      await deleteLearningObjectiveValidation(params);
      break;
    }
    case 'deleteQuestionBank' : {
      await deleteQuestionBankValidation(params);
      break;
    }
    default : {
      /* If context is not present then it means user is not authenticated and the
      user won't be able to make any db query
      */
      /* Queries are without input but they are not calling prehook function */
      if (input) {
        const { decodedUser } = context;
        // Backend apps won't be having any decoded user
        if (decodedUser) {
          const { status } = decodedUser;
          // for rest of the operations user status need to be inctive state
          if (status && status !== 'active') {
            throw new UnauthorizedOperationError();
          }
        }
      }
    }
  }
  return hook(input, mutationOrQueryName, 'PreHook');
};

// This hook is used to transform output data for a mutation.
/*
Params: input,mutationName,context,params
 */
const posthook = async (input, mutationName, params) => {
  switch (mutationName) {
    case 'deleteFile' : {
      const { uri } = input;
      await deleteFromS3(uri);
      break;
    }
    case 'deleteFiles' : {
      const urisToDelete = input.map(record => record.uri);
      /* eslint no-restricted-syntax: ["error", "FunctionExpression", "WithStatement",
      "BinaryExpression[operator='in']"] */
      for (const uri of urisToDelete) {
        /* eslint-disable no-await-in-loop */
        await deleteFromS3(uri);
        /* eslint-enable no-await-in-loop */
      }
      break;
    }
    case 'userVideo' : {
      const filterArray = get(params, 'filter.and');
      const userSome = filterArray.find(obj => obj.user_some);
      const topicSome = filterArray.find(obj => obj.topic_some);
      const userId = get(userSome, 'user_some.id');
      const topicId = get(topicSome, 'topic_some.id');
      if (userId && topicId && input && input.length === 0) {
        console.log('-------------------------------------result', input);
        const addUserVideoMutation = `
              mutation{
                  addUserVideo(
                  userConnectId:"${userId}"
                  topicConnectId:"${topicId}"
                  input:{
                      status: ${userComponentStatus.incomplete}
                  }
              ){
                    id
                    user{
                      id
                    }
                    topic{
                      id
                    }
                    videoCurrentTime
                    isBookmarked
                    isLiked
                    status
                  }
              }
              `;
        const resultArray = [];
        const result = await callGraphqlApi(addUserVideoMutation);
        console.log('-------------------------------------new result', result.data.addUserVideo);
        if (result) {
          const parsedData = get(result, 'data.addUserVideo');
          if (parsedData) {
            const topic = { type: 'Topic', typeId: `${parsedData.topic.id}` };
            const user = { type: 'User', typeId: `${parsedData.user.id}` };
            parsedData.topic = topic;
            parsedData.user = user;
            resultArray.push(parsedData);
          }
        }
        return hook(resultArray, mutationName, 'PostHook');
      }
      break;
      // return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'userLo' : {
      const filterArray = get(params, 'filter.and');
      console.log('-----------------------------------filterArray', JSON.stringify(filterArray));
      const userSome = filterArray.find(obj => obj.user_some);
      const loSome = filterArray.find(obj => obj.learningObjective_some);
      console.log('-----------------------------------userSome', userSome);
      console.log('-----------------------------------loSome', loSome);
      const userId = get(userSome, 'user_some.id');
      const learningObjectiveId = get(loSome, 'learningObjective_some.id');
      if (userId && learningObjectiveId && input && input.length === 0) {
        const learningObjectiveQuery = `
          query{
            learningObjective(id:"${learningObjectiveId}"){
              id
              order
              topic{
                id
                order
                isTrial
                learningObjectives{
                  id
                  order
                }
              }
              questionBank(filter:{assessmentType:${componentTypes.practiceQuestion}}){
                id
              }
            }
          }
          `;
        const learningObjectiveQueryRes = await callGraphqlApi(learningObjectiveQuery);
        const learningObjectiveInfo = get(learningObjectiveQueryRes, 'data.learningObjective');
        console.log('-------------------------------------result', input);
        let practiceQuestionsQuery = 'practiceQuestions:[';
        if (learningObjectiveInfo) {
          const practiceQuestionsinLO = get(learningObjectiveInfo, 'questionBank');
          practiceQuestionsinLO.forEach((practiceQuestion) => {
            practiceQuestionsQuery += `{ questionConnectId: "${practiceQuestion.id}" }, `;
          });
        }
        practiceQuestionsQuery += ']';
        console.log('-----------------practiceQuestionsQuery', practiceQuestionsQuery);
        const addUserLOMutation = `
              mutation{
                  addUserLO(
                  userConnectId:"${userId}"
                  learningObjectiveConnectId:"${learningObjectiveId}"
                  input:{
                      ${practiceQuestionsQuery}
                  }
              ){
                    id
                    user{
                      id
                    }
                    learningObjective{
                      id
                    }
                    chatStatus
                    isChatBookmarked
                    practiceQuestionStatus
                    isPracticeQuestionBookmarked
                  }
              }
              `;
        const resultArray = [];
        const result = await callGraphqlApi(addUserLOMutation);
        console.log('-------------------------------------new data', result.data);
        console.log('-------------------------------------new result', result.data.addUserLO);
        if (result) {
          const parsedData = get(result, 'data.addUserLO');
          if (parsedData) {
            const lo = { type: 'LearningObjective', typeId: `${parsedData.learningObjective.id}` };
            const user = { type: 'User', typeId: `${parsedData.user.id}` };
            parsedData.learningObjective = lo;
            parsedData.user = user;
            resultArray.push(parsedData);
          }
        }
        return hook(resultArray, mutationName, 'PostHook');
      }
      break;
      // return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'addUserActivityVideoDump' : {
      // create a common function to check if the called component is unlocked or not
      // user video collection will be created/updated
      // current component status will also get updated if action type is next
      let learningObjectiveConnectId;
      const userId = get(input, 'user.typeId');
      const topicId = get(input, 'topic.typeId');
      // query to get topic info
      if (userId && topicId) {
        const topicQuery = `
          query{
            topic(id:"${topicId}"){
              id
              order
              learningObjectives(filter:{
                order: 1
              }){
                id
              }
            }
          }
          `;
        const topicQueryRes = await callGraphqlApi(topicQuery);
        const topicInfo = get(topicQueryRes, 'data.topic');

        // query to get current component status of user
        const userCurrentComponentStatusQuery = `
          query{
            userCurrentComponentStatuses(filter:{
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
              }
              currentTopic{
                id
                order
              }
              currentComponentType
              enrollmentType
            }
          }
          `;
        const userCurrentComponentStatusRes = await callGraphqlApi(userCurrentComponentStatusQuery);
        const currentComponentInfo = get(userCurrentComponentStatusRes, 'data.userCurrentComponentStatuses[0]');
        const userVideoQuery = `
          query{
            userVideos(filter:{
              and:[
                {user_some:{
                id:"${userId}"
                }},
              {topic_some:{
                id:"${topicId}"
              }}
              ]
            }){
              id
              status
              nextComponent{
                learningObjective{
                  id
                }
                nextComponentType
              }
            }
          }
          `;
        const userVideoQueryRes = await callGraphqlApi(userVideoQuery);
        // Ideally it should have only 1 document
        const userVideoInfo = get(userVideoQueryRes, 'data.userVideos[0]');
        const userVideoId = get(userVideoInfo, 'id');
        let isBookmarked = false;
        let isLiked = false;
        let videoCurrentTime = 0;
        let status = userComponentStatus.incomplete;

        isBookmarked = get(input, 'isBookmarked');
        isLiked = get(input, 'isLiked');
        videoCurrentTime = get(input, 'videoCurrentTime');
        const videoAction = get(input, 'videoAction');
        if (videoAction && videoAction === userActionType.next) {
          status = userComponentStatus.complete;
        }
        const {
          id: currentComponentId,
          currentComponentType: currentComponent,
          currentTopic,
        } = currentComponentInfo;
        if (currentComponent &&
          currentTopic &&
          topicInfo &&
          videoAction === userActionType.next &&
          currentComponent === componentTypes.video &&
          currentTopic.id === topicInfo.id
        ) {
          learningObjectiveConnectId = get(topicInfo, 'learningObjectives[0].id');
          if (learningObjectiveConnectId) {
            const updateUserCurrentComponentStatusMutation = `
              mutation{
                updateUserCurrentComponentStatus(id:"${currentComponentId}",  input:{
                  currentComponentType: ${componentTypes.message}
                },
                currentLearningObjectiveConnectId:"${learningObjectiveConnectId}"
                ){
                  id
                }
              }
              `;
            await callGraphqlApi(updateUserCurrentComponentStatusMutation);
          } else {
            // log error that no lo is present in the topic with order = 1
            // log(element);
          }
        }
        if (userVideoInfo && userVideoInfo.status === userComponentStatus.complete) {
          status = userComponentStatus.complete;
        }
        let restQuerv = '';
        const nextComponent = get(userVideoInfo, 'nextComponent.learningObjective.id');
        // this condition is to check that next component is populated only once on next
        if (learningObjectiveConnectId &&
          !nextComponent &&
          status === userComponentStatus.complete) {
          restQuerv = `nextComponent:{
                     learningObjectiveConnectId:"${learningObjectiveConnectId}"
                     nextComponentType: ${componentTypes.message}
                   }`;
        }
        if (userVideoId) {
          // update

          const updateUserVideoMutation = `
          mutation{
            updateUserVideo(id:"${userVideoId}",  input:{
              videoCurrentTime: ${videoCurrentTime}
              isBookmarked: ${isBookmarked}
              isLiked: ${isLiked}
              status: ${status}
              ${restQuerv}
            }){
              id
              status
              isBookmarked
              isLiked
              videoCurrentTime
            }
          }
          `;

          await callGraphqlApi(updateUserVideoMutation);
          // log should be added here to confirm whether doc was created
        } else {
          // create
          const addUserVideoMutation = `
              mutation{
                  addUserVideo(
                  userConnectId:"${userId}"
                  topicConnectId:"${topicId}"
                  input:{
                      videoCurrentTime: ${videoCurrentTime}
                      isBookmarked: ${isBookmarked}
                      isLiked: ${isLiked}
                      status: ${status}
                      ${restQuerv}
                  }
              ){
                    id
                      
                  }
              }
              `;

          await callGraphqlApi(addUserVideoMutation);
          // log should be added here to confirm whether doc was created
        }
      }
      break;
    }
    case 'addUserActivityChatDump' : {
      // create a common function to check if the called component is unlocked or not
      // user video collection will be created/updated
      // current component status will also get updated if action type is next
      console.log('------------------------------------------kpkpkpkpkp');
      const userId = get(input, 'user.typeId');
      const learningObjectiveId = get(input, 'learningObjective.typeId');
      if (userId && learningObjectiveId) {
        const learningObjectiveQuery = `
          query{
            learningObjective(id:"${learningObjectiveId}"){
              id
              order
              topic{
                id
                order
                isTrial
              }
            }
          }
          `;
        const learningObjectiveQueryRes = await callGraphqlApi(learningObjectiveQuery);
        const learningObjectiveInfo = get(learningObjectiveQueryRes, 'data.learningObjective');
        console.log('-----------------1111111', JSON.stringify(learningObjectiveInfo));
        const topicInfo = get(learningObjectiveInfo, 'topic');
        // const topicId = get(topicInfo, 'id');
        const learningObjectivetId = get(learningObjectiveInfo, 'id');
        // query to get current component status of user
        const userCurrentComponentStatusQuery = `
          query{
            userCurrentComponentStatuses(filter:{
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
              }
              currentTopic{
                id
                order
              }
              currentLearningObjective{
                id
                order
              }
              currentComponentType
              enrollmentType
            }
          }
          `;
        const userCurrentComponentStatusRes = await callGraphqlApi(userCurrentComponentStatusQuery);
        const currentComponentInfo = get(userCurrentComponentStatusRes, 'data.userCurrentComponentStatuses[0]');
        console.log('-----------------1111111currentComponentInfo', JSON.stringify(currentComponentInfo));
        // log error in else
        const userLOQuery = `
          query{
            userLos(filter:{
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
              chatStatus
              nextComponent{
                learningObjective{
                  id
                }
                nextComponentType
              }
            }
          }
          `;
        const userLOQueryRes = await callGraphqlApi(userLOQuery);
        // Ideally it should have only 1 document
        const userLOInfo = get(userLOQueryRes, 'data.userLos[0]');
        console.log('-----------------1111111userLOInfo', JSON.stringify(userLOInfo));
        const userLOId = get(userLOInfo, 'id');
        let isChatBookmarked = false;
        let chatStatus = userComponentStatus.incomplete;
        const chatAction = get(input, 'chatAction');
        isChatBookmarked = get(input, 'isBookmarked');
        if (chatAction && chatAction === userActionType.next) {
          chatStatus = userComponentStatus.complete;
        }
        const {
          id: currentComponentId,
          currentComponentType: currentComponent,
          currentLearningObjective,
          currentTopic,
        } = currentComponentInfo;
        console.log('-----------------2chatAction', JSON.stringify(chatAction));
        console.log('-----------------3currentComponent', JSON.stringify(currentComponent));
        console.log('-----------------4currentTopic.id', JSON.stringify(currentTopic.id));
        console.log('-----------------5topicInfo.id ', JSON.stringify(topicInfo.id));
        console.log('-----------------6currentLearningObjective.id', JSON.stringify(currentLearningObjective.id));
        console.log('-----------------7learningObjectiveInfo.id', JSON.stringify(learningObjectiveInfo.id));

        if (currentComponent &&
          currentTopic &&
          topicInfo &&
          currentLearningObjective &&
          chatAction === userActionType.next &&
          currentComponent === componentTypes.message &&
          currentTopic.id === topicInfo.id &&
          currentLearningObjective.id === learningObjectiveInfo.id
        ) {
          console.log('-----------------1111111userLOInfo', JSON.stringify(userLOInfo));
          const updateUserCurrentComponentStatusMutation = `
              mutation{
                updateUserCurrentComponentStatus(id:"${currentComponentId}",  input:{
                  currentComponentType: ${componentTypes.practiceQuestion}
                }
                ){
                  id
                }
              }
              `;
          await callGraphqlApi(updateUserCurrentComponentStatusMutation);
        }
        if (userLOInfo && userLOInfo.chatStatus === userComponentStatus.complete) {
          chatStatus = userComponentStatus.complete;
        }
        let restQuerv = '';
        const nextComponent = get(userLOInfo, 'nextComponent.learningObjective.id');
        console.log('-----------------nextComponent', JSON.stringify(nextComponent));
        if (learningObjectivetId && !nextComponent && chatStatus === userComponentStatus.complete) {
          restQuerv = `nextComponent:{
                     learningObjectiveConnectId:"${learningObjectivetId}"
                     nextComponentType: ${componentTypes.practiceQuestion}
                   }`;
        }

        if (userLOId) {
          // update
          console.log('-----------------update');

          const updateUserLOMutation = `
          mutation{
            updateUserLO(id:"${userLOId}",  input:{
              isChatBookmarked: ${isChatBookmarked}
              chatStatus: ${chatStatus}
              ${restQuerv}
            }){
              id
              chatStatus
              isChatBookmarked
            }
          }
          `;

          await callGraphqlApi(updateUserLOMutation);
          // log should be added here to confirm whether doc was created
        } else {
          // create
          console.log('-----------------create');
          const addUserLOMutation = `
              mutation{
                  addUserLO(
                  userConnectId:"${userId}"
                  learningObjectiveConnectId:"${learningObjectivetId}"
                  input:{
                      isChatBookmarked: ${isChatBookmarked}
                      chatStatus: ${chatStatus}
                      ${restQuerv}
                  }
              ){
                    id
                      
                  }
              }
              `;

          await callGraphqlApi(addUserLOMutation);
          // log should be added here to confirm whether doc was created
        }
      }
      break;
    }
    case 'addUserActivityPQDump' : {
      // create a common function to check if the called component is unlocked or not
      // user video collection will be created/updated
      // current component status will also get updated if action type is next
      console.log('------------------------------------------ioioioioioioio');
      const userId = get(input, 'user.typeId');
      const learningObjectiveId = get(input, 'learningObjective.typeId');
      if (userId && learningObjectiveId) {
        const learningObjectiveQuery = `
          query{
            learningObjective(id:"${learningObjectiveId}"){
              id
              order
              topic{
                id
                order
                isTrial
                learningObjectives{
                  id
                  order
                }
              }
              questionBank(filter:{assessmentType:${componentTypes.practiceQuestion}}){
                id
              }
            }
          }
          `;
        const learningObjectiveQueryRes = await callGraphqlApi(learningObjectiveQuery);
        const learningObjectiveInfo = get(learningObjectiveQueryRes, 'data.learningObjective');
        console.log('-----------------1111111', JSON.stringify(learningObjectiveInfo));
        const topicInfo = get(learningObjectiveInfo, 'topic');
        // const topicId = get(topicInfo, 'id');
        const learningObjectiveOrder = get(learningObjectiveInfo, 'order');
        const learningObjectivetId = get(learningObjectiveInfo, 'id');
        // query to get current component status of user
        const userCurrentComponentStatusQuery = `
          query{
            userCurrentComponentStatuses(filter:{
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
              }
              currentTopic{
                id
                order
              }
              currentLearningObjective{
                id
                order
              }
              currentComponentType
              enrollmentType
            }
          }
          `;
        const userCurrentComponentStatusRes = await callGraphqlApi(userCurrentComponentStatusQuery);
        const currentComponentInfo = get(userCurrentComponentStatusRes, 'data.userCurrentComponentStatuses[0]');
        console.log('-----------------1111111currentComponentInfo', JSON.stringify(currentComponentInfo));
        // log error in else
        const userLOQuery = `
          query{
            userLos(filter:{
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
              practiceQuestionStatus
              practiceQuestions{
                question{
                  id
                }
                isHintused
                isAnswerUsed
                attemptNumber
                status
              }
              nextComponent{
                learningObjective{
                  id
                }
                nextComponentType
              }
            }
          }
          `;
        const userLOQueryRes = await callGraphqlApi(userLOQuery);
        // Ideally it should have only 1 document
        const userLOInfo = get(userLOQueryRes, 'data.userLos[0]');
        console.log('-----------------1111111userLOInfo', JSON.stringify(userLOInfo));
        const userLOId = get(userLOInfo, 'id');
        let isPracticeQuestionBookmarked = false;
        let practiceQuestionStatus = get(userLOInfo, 'practiceQuestionStatus', userComponentStatus.incomplete);
        const practiceQuestionStatusBeforeUpdate = get(userLOInfo, 'practiceQuestionStatus');
        const pqAction = get(input, 'pqAction');
        isPracticeQuestionBookmarked = get(input, 'isBookmarked');
        if (pqAction && pqAction === userActionType.next) {
          practiceQuestionStatus = userComponentStatus.complete;
        }
        const {
          id: currentComponentId,
          currentComponentType: currentComponent,
          currentLearningObjective,
          currentTopic,
        } = currentComponentInfo;
        console.log('-----------------2chatAction', JSON.stringify(pqAction));
        console.log('-----------------3currentComponent', JSON.stringify(currentComponent));
        console.log('-----------------4currentTopic.id', JSON.stringify(currentTopic.id));
        console.log('-----------------5topicInfo.id ', JSON.stringify(topicInfo.id));
        console.log('-----------------6currentLearningObjective.id', JSON.stringify(currentLearningObjective.id));
        console.log('-----------------7learningObjectiveInfo.id', JSON.stringify(learningObjectiveInfo.id));
        if (userLOInfo && userLOInfo.practiceQuestionStatus === userComponentStatus.complete) {
          practiceQuestionStatus = userComponentStatus.complete;
        }
        let restQuerv = '';
        const nextComponent = get(userLOInfo, 'nextComponent.learningObjective.id');
        console.log('-----------------nextComponent', JSON.stringify(nextComponent));


        if (currentComponent &&
          currentTopic &&
          topicInfo &&
          currentLearningObjective &&
          pqAction === userActionType.next &&
          currentComponent === componentTypes.practiceQuestion &&
          currentTopic.id === topicInfo.id &&
          currentLearningObjective.id === learningObjectiveInfo.id
        ) {
          console.log('-----------------1111111userLOInfo', JSON.stringify(userLOInfo));
          const learningObjectives = get(topicInfo, 'learningObjectives');
          const nextLearningObjectiveOrder = parseInt(learningObjectiveOrder, 10) + 1;
          let nextLOId;
          let nextCurrentComponentType;
          let restUserCurrentComponentStatusQuerv = '';
          let learningObjectiveConnectIdQuerv = '';
          learningObjectives.forEach((learningObjective) => {
            if (learningObjective &&
              learningObjective.order === nextLearningObjectiveOrder
            ) {
              nextLOId = learningObjective.id;
              console.log('--------------------------44444444', nextLOId);
            }
          });
          if (nextLOId) {
            nextCurrentComponentType = componentTypes.message;
            restUserCurrentComponentStatusQuerv = `currentLearningObjectiveConnectId:"${nextLOId}"`;
            learningObjectiveConnectIdQuerv = `learningObjectiveConnectId:"${nextLOId}"`;
          } else {
            nextCurrentComponentType = componentTypes.quiz;
          }
          // restQuery is for when we ceate/update userLO
          if (learningObjectivetId &&
            practiceQuestionStatus === userComponentStatus.complete) {
            restQuerv = `nextComponent:{
                     ${learningObjectiveConnectIdQuerv}
                     nextComponentType: ${nextCurrentComponentType}
                   }`;
          }

          const updateUserCurrentComponentStatusMutation = `
              mutation{
                updateUserCurrentComponentStatus(id:"${currentComponentId}",  input:{
                  currentComponentType: ${nextCurrentComponentType}
                }
                ${restUserCurrentComponentStatusQuerv}
                ){
                  id
                }
              }
              `;
          await callGraphqlApi(updateUserCurrentComponentStatusMutation);
        }
        if (userLOId) {
          // update userLO
          console.log('-----------------update');
          let firstTryCount = 0;
          let secondTryCount = 0;
          let threeOrMoreTryCount = 0;
          let helpUsedCount = 0;
          let answerUsedCount = 0;
          let inputQuestion;
          let isCorrect;
          let isHintused;
          let isAnswerUsed;
          let attemptNumber;
          let status;
          let inputQuestionConnectId;
          let pushManyQuery = 'practiceQuestions:{ pushMany: [';
          const inputPracticeQuestions = get(input, 'practiceQuestions');
          const practiceQuestionsInUserLO = get(userLOInfo, 'practiceQuestions');
          if (inputPracticeQuestions.length && practiceQuestionsInUserLO.length) {
            practiceQuestionsInUserLO.forEach((practiceQuestionInUserLO) => {
              console.log('*********************************************', practiceQuestionInUserLO);
              const { question, ...newPracticeQuestionInUserLO } = practiceQuestionInUserLO;
              const questionConnectId = get(practiceQuestionInUserLO, 'question.id');
              pushManyQuery += `{ questionConnectId: "${questionConnectId}", `;
              inputPracticeQuestions.forEach((inputPracticeQuestion) => {
                inputQuestion = get(inputPracticeQuestion, 'question');
                isCorrect = get(inputPracticeQuestion, 'isCorrect');
                isHintused = get(inputPracticeQuestion, 'isHintused');
                isAnswerUsed = get(inputPracticeQuestion, 'isAnswerUsed');
                attemptNumber = get(inputPracticeQuestion, 'attemptNumber');
                status = get(inputPracticeQuestion, 'status');
                inputQuestionConnectId = get(inputQuestion, 'typeId');
                if (questionConnectId === inputQuestionConnectId) {
                  console.log('*********************************************kp11111', JSON.stringify(newPracticeQuestionInUserLO));
                  Object.assign(newPracticeQuestionInUserLO, { questionConnectId });
                  if (practiceQuestionStatusBeforeUpdate === userComponentStatus.incomplete &&
                    practiceQuestionInUserLO.status === userComponentStatus.incomplete
                  ) {
                    console.log('***********************************kp11111', isHintused);
                    console.log('***********************************kp11111', isAnswerUsed);
                    console.log('***********************************kp11111', status);
                    console.log('***********************************kp11111', isCorrect);
                    console.log('***********************************kp11111', attemptNumber);
                    if (isHintused === true) {
                      Object.assign(newPracticeQuestionInUserLO, { isHintused });
                    }
                    if (isAnswerUsed === true) {
                      Object.assign(newPracticeQuestionInUserLO, { isAnswerUsed });
                    }
                    if (status === userComponentStatus.complete) {
                      Object.assign(newPracticeQuestionInUserLO, { status });
                    }
                    if (isCorrect === true && attemptNumber) {
                      Object.assign(newPracticeQuestionInUserLO, { attemptNumber });
                    }
                  } else if (practiceQuestionStatus === userComponentStatus.complete &&
                    practiceQuestionInUserLO.status === userComponentStatus.complete) {
                    Object.assign(newPracticeQuestionInUserLO, { isHintused });
                    Object.assign(newPracticeQuestionInUserLO, { isAnswerUsed });
                    if (isCorrect === true && attemptNumber) {
                      Object.assign(newPracticeQuestionInUserLO, { attemptNumber });
                    }
                  }
                }
              });
              console.log('*********************************************kp22222', JSON.stringify(newPracticeQuestionInUserLO));
              pushManyQuery += `isHintused: ${newPracticeQuestionInUserLO.isHintused}, 
                                               isAnswerUsed: ${newPracticeQuestionInUserLO.isAnswerUsed}, 
                                               attemptNumber: ${newPracticeQuestionInUserLO.attemptNumber}, 
                                               status: ${newPracticeQuestionInUserLO.status}, 
                                              }, `;
              if (pqAction === userActionType.next) {
                if (newPracticeQuestionInUserLO.isHintused) helpUsedCount += 1;
                if (newPracticeQuestionInUserLO.isAnswerUsed) answerUsedCount += 1;
                if (newPracticeQuestionInUserLO.attemptNumber === 1) {
                  firstTryCount += 1;
                } else if (newPracticeQuestionInUserLO.attemptNumber === 2) {
                  secondTryCount += 1;
                } else {
                  threeOrMoreTryCount += 1;
                }
              }
            });
          }
          pushManyQuery += ']}';
          let popAllQuery = '';
          popAllQuery = `practiceQuestions:{
                     popAll: true
                   }`;
          const updateUserLOMutation = `
          mutation{
            updateUserLO(id:"${userLOId}",  input:{
              isPracticeQuestionBookmarked: ${isPracticeQuestionBookmarked}
              practiceQuestionStatus: ${practiceQuestionStatus}
              ${restQuerv}
              ${popAllQuery}
            }){
              id
            }
          }
          `;

          await callGraphqlApi(updateUserLOMutation);

          const updateUserLOMutationPracticeQuestions = `
              mutation{
                updateUserLO(id:"${userLOId}",  input:{
                  ${pushManyQuery}
                }){
                  id
                }
              }
              `;

          await callGraphqlApi(updateUserLOMutationPracticeQuestions);
          if (pqAction === userActionType.next) {
            const addUserPracticeQuestionReportMutation = `
              mutation{
                  addUserPracticeQuestionReport(
                  userConnectId:"${userId}"
                  learningObjectiveConnectId:"${learningObjectivetId}"
                  input:{
                      firstTryCount: ${firstTryCount}
                      secondTryCount: ${secondTryCount}
                      threeOrMoreTryCount: ${threeOrMoreTryCount}
                      helpUsedCount: ${helpUsedCount}
                      answerUsedCount: ${answerUsedCount}
                  }
              ){
                    id
                      
                  }
              }
              `;

            await callGraphqlApi(addUserPracticeQuestionReportMutation);
          }

          // log should be added here to confirm whether doc was created
        } else {
          // create
          console.log('-----------------create');
          let practiceQuestionsQuery = 'practiceQuestions:[';
          if (learningObjectiveInfo) {
            const practiceQuestionsinLO = get(learningObjectiveInfo, 'questionBank');
            practiceQuestionsinLO.forEach((practiceQuestion) => {
              practiceQuestionsQuery += `{ questionConnectId: "${practiceQuestion.id}" }, `;
            });
          }
          practiceQuestionsQuery += ']';
          console.log('-----------------practiceQuestionsQuery', practiceQuestionsQuery);
          const addUserLOMutation = `
              mutation{
                  addUserLO(
                  userConnectId:"${userId}"
                  learningObjectiveConnectId:"${learningObjectivetId}"
                  input:{
                      isPracticeQuestionBookmarked: ${isPracticeQuestionBookmarked}
                      practiceQuestionStatus: ${practiceQuestionStatus}
                      ${practiceQuestionsQuery}
                      ${restQuerv}
                  }
              ){
                    id
                      
                  }
              }
              `;

          await callGraphqlApi(addUserLOMutation);
          // log should be added here to confirm whether doc was created
        }
      }
      break;
    }
    case 'addUserActivityQuizDump' : {
      // create a common function to check if the called component is unlocked or not
      // user video collection will be created/updated
      // current component status will also get updated if action type is next
      const userId = get(input, 'user.typeId');
      const topicId = get(input, 'topic.typeId');
      if (userId && topicId) {
        // query to get current component status of user
        let nextTopicId;
        let restQuery = '';
        const userCurrentComponentStatusQuery = `
          query{
            userCurrentComponentStatuses(filter:{
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
              }
              currentTopic{
                id
                order
              }
              currentComponentType
              enrollmentType
            }
          }
          `;
        const userCurrentComponentStatusRes = await callGraphqlApi(userCurrentComponentStatusQuery);
        const currentComponentInfo = get(userCurrentComponentStatusRes, 'data.userCurrentComponentStatuses[0]');
        const quizAction = get(input, 'quizAction');
        const {
          id: currentComponentId,
          currentComponentType: currentComponent,
          currentTopic,
        } = currentComponentInfo;
        if (currentComponent &&
          currentTopic &&
          quizAction === userActionType.next &&
          currentComponent === componentTypes.quiz &&
          currentTopic.id === topicId
        ) {
          const currentTopicOrder = currentTopic.order;
          if (currentTopicOrder) {
            const nextTopicOrder = currentTopic.order + 1;
            // query to get next topic
            const nextTopicQuery = `
              query{
                topics(filter:{
                  order: ${nextTopicOrder}
                }){
                  id
                }
              }
            `;
            const nextTopicResult = await callGraphqlApi(nextTopicQuery);
            nextTopicId = get(nextTopicResult, 'data.topics[0].id');
            console.log('-----------------------------------nextTopicId', nextTopicId);
            if (nextTopicId) {
              restQuery = `nextComponent:{
                     currentTopicConnectId:"${nextTopicId}"
                     nextComponentType: ${componentTypes.video}
                   }`;
              const updateUserCurrentComponentStatusMutation = `
              mutation{
                updateUserCurrentComponentStatus(id:"${currentComponentId}",  input:{
                  currentComponentType: ${componentTypes.video}
                },
                currentTopicConnectId:"${nextTopicId}"
                ){
                  id
                }
              }
              `;
              await callGraphqlApi(updateUserCurrentComponentStatusMutation);
            }
          } else {
            // log error if unable to fetch order
          }
        }
        console.log('-----------------------restQuery', restQuery);
        // code to evaluate report of quiz
        const quizQuestions = get(input, 'quizQuestions');
        if (// quizAction === userActionType.next &&
          quizQuestions.length) {
          quizQuestions.forEach((quizQuestion) => {
            console.log('----------------------------------------quizQuestion', quizQuestion);
          });
        }
      }
      break;
    }
    default :
      break;
  }
  return hook(input, mutationName, 'PostHook');
};

export { prehook, posthook };

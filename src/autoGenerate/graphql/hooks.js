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
}
  from '../../../constants/errors';
import {
  BYPASS,
  GLOBAL_COURSE_ID,
  userActionType,
  userComponentStatus,
  componentTypes,
  PUBLISHED,
  questionTypes,
  scholarshipThreshHolds,
  freeTopicCount,
} from '../../../constants';

import { createStaticAppToken } from '../../auth';
import deleteFromS3 from '../../middlewares/utils/deleteFromS3';
import { callAddUpdateHookValidationFunction } from './preHookFunctions/validation/utils';
import deleteTopicValidation from './preHookFunctions/validation/deleteTopicValidation';
import deleteLearningObjectiveValidation from './preHookFunctions/validation/deleteLearningObjectiveValidation';
import deleteQuestionBankValidation from './preHookFunctions/validation/deleteQuestionBankValidation';
import callGraphqlApi from '../../api/callGraphqlApi';
import addUserCurrentComponentStatusMethod
  from './preHookFunctions/addUserCurrentComponentStatusMethod';
import updateUserCurrentComponentStatusMethod
  from './preHookFunctions/updateUserCurrentComponentStatusMethod';
import userCourseSyllabusMethod from './preHookFunctions/userCourseSyllabusMethod';
import addUserActivityVideoDumpMethod from './preHookFunctions/addUserActivityVideoDumpMethod';
import addUserActivityChatDumpMethod from './preHookFunctions/addUserActivityChatDumpMethod';
import addUserActivityPQDumpMethod from './preHookFunctions/addUserActivityPQDumpMethod';
import addUserActivityQuizDumpMethod from './preHookFunctions/addUserActivityQuizDumpMethod';
import userVideoMethod from './preHookFunctions/userVideoMethod';
import userLoMethod from './preHookFunctions/userLoMethod';
import userQuizMethod from './preHookFunctions/userQuizMethod';

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
  switch (mutationOrQueryName) {
    case 'addUserCurrentComponentStatus' : {
      await addUserCurrentComponentStatusMethod(params);
      break;
    }
    case 'updateUserCurrentComponentStatus' : {
      await updateUserCurrentComponentStatusMethod(params);
      break;
    }
    case 'userCourseSyllabus' : {
      await userCourseSyllabusMethod(context);
      break;
    }
    case 'addUserActivityVideoDump' : {
      await addUserActivityVideoDumpMethod(params);
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'addUserActivityChatDump' : {
      await addUserActivityChatDumpMethod(params);
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'addUserActivityPQDump' : {
      await addUserActivityPQDumpMethod(params);
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'addUserActivityQuizDump' : {
      await addUserActivityQuizDumpMethod(params);
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'userVideo' : {
      await userVideoMethod(params);
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'userLo' : {
      await userLoMethod(params);
      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'userQuiz' : {
      await userQuizMethod(params);
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
      // value of input in case of query is result of the query
      // so we are adding new document if document is not already present
      if (userId && topicId && input && input.length === 0) {
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
        const learningObjectiveConnectId = get(topicInfo, 'learningObjectives[0].id');
        let restQuerv = '';
        if (learningObjectiveConnectId) {
          restQuerv = `nextComponent:{
                     learningObjectiveConnectId:"${learningObjectiveConnectId}"
                     nextComponentType: ${componentTypes.message}
                   }`;
        }
        const addUserVideoMutation = `
              mutation{
                  addUserVideo(
                  userConnectId:"${userId}"
                  topicConnectId:"${topicId}"
                  input:{
                      status: ${userComponentStatus.incomplete}
                      ${restQuerv}
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
        if (result) {
          // parsing data 'addUserVideo' so that the logic implemented ahead can read data is
          // desired format and return the same
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
    }
    case 'userLo' : {
      const filterArray = get(params, 'filter.and');
      const userSome = filterArray.find(obj => obj.user_some);
      const loSome = filterArray.find(obj => obj.learningObjective_some);
      const userId = get(userSome, 'user_some.id');
      const learningObjectiveId = get(loSome, 'learningObjective_some.id');
      // value of input in case of query is result of the query
      // so we are adding new document if document is not already present
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
        const topicInfo = get(learningObjectiveInfo, 'topic');
        const topicId = get(topicInfo, 'id');
        const learningObjectivetId = get(learningObjectiveInfo, 'id');
        const learningObjectiveOrder = get(learningObjectiveInfo, 'order');
        // adding PQs to the userLO document
        let practiceQuestionsQuery = 'practiceQuestions:[';
        if (learningObjectiveInfo) {
          const practiceQuestionsinLO = get(learningObjectiveInfo, 'questionBank');
          practiceQuestionsinLO.forEach((practiceQuestion) => {
            practiceQuestionsQuery += `{ questionConnectId: "${practiceQuestion.id}" }, `;
          });
        }
        practiceQuestionsQuery += ']';
        let restQuerv = '';
        const learningObjectives = get(topicInfo, 'learningObjectives');
        // obtaining next LO
        const nextLearningObjectiveOrder = parseInt(learningObjectiveOrder, 10) + 1;
        let nextLOId;
        let nextCurrentComponentType;
        let learningObjectiveConnectIdQuerv = '';
        let topicConnectIdQuerv = '';
        learningObjectives.forEach((learningObjective) => {
          if (learningObjective &&
            learningObjective.order === nextLearningObjectiveOrder
          ) {
            nextLOId = learningObjective.id;
          }
        });
        // if next LO is not present in that case, quiz will be next component
        if (nextLOId) {
          nextCurrentComponentType = componentTypes.message;
          learningObjectiveConnectIdQuerv = `learningObjectiveConnectId:"${nextLOId}"`;
        } else {
          topicConnectIdQuerv = `topicConnectId:"${topicId}"`;
          nextCurrentComponentType = componentTypes.quiz;
        }
        // restQuery is for when we ceate/update userLO
        if (learningObjectivetId) {
          restQuerv = `nextComponent:{
                     ${learningObjectiveConnectIdQuerv}
                     ${topicConnectIdQuerv}
                     nextComponentType: ${nextCurrentComponentType}
                   }`;
        }

        const addUserLOMutation = `
              mutation{
                  addUserLO(
                  userConnectId:"${userId}"
                  learningObjectiveConnectId:"${learningObjectiveId}"
                  input:{
                      ${restQuerv}
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
        if (result) {
          // parsing data 'addUserVideo' so that the logic implemented ahead can read data is
          // desired format and return the same
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
    }
    case 'userQuiz' : {
      const filterArray = get(params, 'filter.and');
      const userSome = filterArray.find(obj => obj.user_some);
      const loSome = filterArray.find(obj => obj.topic_some);
      const userId = get(userSome, 'user_some.id');
      const topicId = get(loSome, 'topic_some.id');
      // value of input in case of query is result of the query
      // so we are adding new document if document is not already present
      if (userId && topicId && input && input.length === 0) {
        const topicQuery = `
          query{
            topic(id:"${topicId}"){
              id
              order
              questions(filter:{assessmentType:${componentTypes.quiz}}){
                id
                order
              }
            }
          }
          `;
        const topicQueryRes = await callGraphqlApi(topicQuery);
        const topicInfo = get(topicQueryRes, 'data.topic');
        const topicOrder = get(topicInfo, 'order');
        // adding quiz questions in the document
        // this logic will be changed based on set
        let quizQuery = 'quiz:[';
        if (topicInfo) {
          const quizQuestionsinTopic = get(topicInfo, 'questions');
          quizQuestionsinTopic.forEach((quizQuestion) => {
            quizQuery += `{ questionConnectId: "${quizQuestion.id}"
                            questionDisplayOrder: ${quizQuestion.order}
                          }, `;
          });
        }
        quizQuery += ']';
        let restQuerv = '';
        if (topicOrder) {
          const nextTopicOrder = topicOrder + 1;
          const nextTopicQuery = `
          query{
            topics(filter:{
              and:[
                {order:${nextTopicOrder}},
                {status: ${PUBLISHED}}
              ]
            }){
              id
            }
          }
          `;
          const nextTopicQueryRes = await callGraphqlApi(nextTopicQuery);
          const nextTopicInfo = get(nextTopicQueryRes, 'data.topics[0]');
          const nextTopicId = get(nextTopicInfo, 'id');
          if (nextTopicId) {
            restQuerv = `nextComponent:{
                     topicConnectId:"${nextTopicId}"
                     nextComponentType: ${componentTypes.video}
                   }`;
          }
          // In case of last topic quiz, next component in not populated
        }

        const addUserQuizMutation = `
              mutation{
                  addUserQuiz(
                  userConnectId:"${userId}"
                  topicConnectId:"${topicId}"
                  input:{
                      ${restQuerv}
                      ${quizQuery}
                  }
              ){
                    id
                    user{
                      id
                    }
                    topic{
                      id
                    }
                    quizStatus
                    quiz{
                      question{
                        id
                      }
                      questionDisplayOrder
                    }
                  }
              }
              `;
        const resultArray = [];
        const result = await callGraphqlApi(addUserQuizMutation);
        if (result) {
          // parsing data 'addUserVideo' so that the logic implemented ahead can read data is
          // desired format and return the same
          const parsedData = get(result, 'data.addUserQuiz');
          if (parsedData) {
            const topic = { type: 'Topic', typeId: `${parsedData.topic.id}` };
            const user = { type: 'User', typeId: `${parsedData.user.id}` };
            const quiz = [];
            const quizRes = parsedData.quiz;
            if (quizRes) {
              quizRes.forEach((quizQuestion) => {
                const question = { question: { type: 'QuestionBank',
                  typeId: `${quizQuestion.question.id}` },
                questionDisplayOrder: `${quizQuestion.questionDisplayOrder}` };
                quiz.push(question);
              });
            }
            parsedData.topic = topic;
            parsedData.user = user;
            parsedData.quiz = quiz;
            resultArray.push(parsedData);
          }
        }
        return hook(resultArray, mutationName, 'PostHook');
      }
      break;
    }
    case 'addUserActivityVideoDump' : {
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
        const userVideoInfo = get(userVideoQueryRes, 'data.userVideos[0]');
        const userVideoId = get(userVideoInfo, 'id');
        let isBookmarked = false;
        let isLiked = false;
        let videoCurrentTime = 0;
        let status = userComponentStatus.incomplete;
        let learningObjectiveConnectId;
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
          }
        }
        if (userVideoInfo && userVideoInfo.status === userComponentStatus.complete) {
          status = userComponentStatus.complete;
        }
        let restQuerv = '';
        const nextComponent = get(userVideoInfo, 'nextComponent.learningObjective.id');
        // this condition is to check that next component is populated only once on next
        if (learningObjectiveConnectId &&
          !nextComponent) {
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
        }
      }
      break;
    }
    case 'addUserActivityChatDump' : {
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
        const topicInfo = get(learningObjectiveInfo, 'topic');
        const topicId = get(topicInfo, 'id');
        const learningObjectivetId = get(learningObjectiveInfo, 'id');
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
        const userLOInfo = get(userLOQueryRes, 'data.userLos[0]');
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
        if (currentComponent &&
          currentTopic &&
          topicInfo &&
          currentLearningObjective &&
          chatAction === userActionType.next &&
          currentComponent === componentTypes.message &&
          currentTopic.id === topicId &&
          currentLearningObjective.id === learningObjectiveInfo.id
        ) {
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
        const learningObjectives = get(topicInfo, 'learningObjectives');
        const nextLearningObjectiveOrder = parseInt(learningObjectiveOrder, 10) + 1;
        let nextLOId;
        let nextCurrentComponentType;
        let learningObjectiveConnectIdQuerv = '';
        let topicConnectIdQuerv = '';
        learningObjectives.forEach((learningObjective) => {
          if (learningObjective &&
            learningObjective.order === nextLearningObjectiveOrder
          ) {
            nextLOId = learningObjective.id;
          }
        });
        // checking if next component is quiz or message
        if (nextLOId) {
          nextCurrentComponentType = componentTypes.message;
          learningObjectiveConnectIdQuerv = `learningObjectiveConnectId:"${nextLOId}"`;
        } else {
          topicConnectIdQuerv = `topicConnectId:"${topicId}"`;
          nextCurrentComponentType = componentTypes.quiz;
        }
        // restQuery is for when we ceate/update userLO
        if (learningObjectivetId && !nextComponent) {
          restQuerv = `nextComponent:{
                     ${learningObjectiveConnectIdQuerv}
                     ${topicConnectIdQuerv}
                     nextComponentType: ${nextCurrentComponentType}
                   }`;
        }

        if (userLOId) {
          // update
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
        }
      }
      break;
    }
    case 'addUserActivityPQDump' : {
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
        const topicInfo = get(learningObjectiveInfo, 'topic');
        const topicId = get(topicInfo, 'id');
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
        const userLOInfo = get(userLOQueryRes, 'data.userLos[0]');
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
        if (userLOInfo && userLOInfo.practiceQuestionStatus === userComponentStatus.complete) {
          practiceQuestionStatus = userComponentStatus.complete;
        }
        let restQuerv = '';
        const nextComponent = get(userLOInfo, 'nextComponent.learningObjective.id');
        const learningObjectives = get(topicInfo, 'learningObjectives');
        const nextLearningObjectiveOrder = parseInt(learningObjectiveOrder, 10) + 1;
        let nextLOId;
        let nextCurrentComponentType;
        let restUserCurrentComponentStatusQuerv = '';
        let learningObjectiveConnectIdQuerv = '';
        let topicConnectIdQuerv = '';
        learningObjectives.forEach((learningObjective) => {
          if (learningObjective &&
            learningObjective.order === nextLearningObjectiveOrder
          ) {
            nextLOId = learningObjective.id;
          }
        });
        // logic for checking the next component
        if (nextLOId) {
          nextCurrentComponentType = componentTypes.message;
          restUserCurrentComponentStatusQuerv = `currentLearningObjectiveConnectId:"${nextLOId}"`;
          learningObjectiveConnectIdQuerv = `learningObjectiveConnectId:"${nextLOId}"`;
        } else {
          topicConnectIdQuerv = `topicConnectId:"${topicId}"`;
          nextCurrentComponentType = componentTypes.quiz;
        }
        // restQuery is for when we ceate/update userLO
        if (learningObjectivetId && !nextComponent) {
          restQuerv = `nextComponent:{
                     ${learningObjectiveConnectIdQuerv}
                     ${topicConnectIdQuerv}
                     nextComponentType: ${nextCurrentComponentType}
                   }`;
        }

        if (currentComponent &&
          currentTopic &&
          topicInfo &&
          currentLearningObjective &&
          pqAction === userActionType.next &&
          currentComponent === componentTypes.practiceQuestion &&
          currentTopic.id === topicInfo.id &&
          currentLearningObjective.id === learningObjectiveInfo.id
        ) {
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
              // storing all the passed info in input in newPracticeQuestionInUserLO
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
                  Object.assign(newPracticeQuestionInUserLO, { questionConnectId });
                  // case when individual question is incomplete and
                  // practice question is also incomplete
                  if (practiceQuestionStatusBeforeUpdate === userComponentStatus.incomplete &&
                    practiceQuestionInUserLO.status === userComponentStatus.incomplete
                  ) {
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
                    // case when PQ is already completed and user is reattempting
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
              // ceating query which will be sent in UserLO
              pushManyQuery += `isHintused: ${newPracticeQuestionInUserLO.isHintused}, 
                                               isAnswerUsed: ${newPracticeQuestionInUserLO.isAnswerUsed}, 
                                               attemptNumber: ${newPracticeQuestionInUserLO.attemptNumber}, 
                                               status: ${newPracticeQuestionInUserLO.status}, 
                                              }, `;

              // these properties will be used in UserPracticeQuestionReport
              // PQ report will only be generated when user hits next
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
          // popping all the practice questions
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
          // pushing updated practice questions
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
          // PQ report will only be generated when user hits next
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
        }
      }
      break;
    }
    case 'addUserActivityQuizDump' : {
      const userId = get(input, 'user.typeId');
      const topicId = get(input, 'topic.typeId');
      if (userId && topicId) {
        // query to get current component status of user
        let nextTopicId;
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
                  and:[
                  {order:${nextTopicOrder}},
                  {status: ${PUBLISHED}}
                ]
                }){
                  id
                  learningObjectives(filter:{
                    order: 1
                  }){
                    id
                  }
                }
              }
            `;
            const nextTopicResult = await callGraphqlApi(nextTopicQuery);
            const nextTopicInfo = get(nextTopicResult, 'data.topics[0]');
            nextTopicId = get(nextTopicInfo, 'id');
            const learningObjectiveConnectId = get(nextTopicInfo, 'learningObjectives[0].id');
            let loQuery = '';
            if (learningObjectiveConnectId) { loQuery = `currentLearningObjectiveConnectId:"${learningObjectiveConnectId}"`; }
            // updating current component in case quiz is completed by user
            if (nextTopicId) {
              const updateUserCurrentComponentStatusMutation = `
              mutation{
                updateUserCurrentComponentStatus(id:"${currentComponentId}",  input:{
                  currentComponentType: ${componentTypes.video}
                },
                currentTopicConnectId:"${nextTopicId}"
                ${loQuery}
                ){
                  id
                }
              }
              `;
              await callGraphqlApi(updateUserCurrentComponentStatusMutation);
            }
          }
        }

        const userQuizQuery = `
          query{
            userQuizs(filter:{
              and:[
                {user_some:{
                id:"${userId}"
                }},
                {topic_some:{
                  id:"${topicId}"
                }},
                {
                  quizStatus: ${userComponentStatus.incomplete}
                }
              ]
            }){
              id
              quizStatus
            }
          }
          `;
        const userQuizQueryRes = await callGraphqlApi(userQuizQuery);
        const userQuizInfo = get(userQuizQueryRes, 'data.userQuizs[0]');
        const userQuizId = get(userQuizInfo, 'id');
        // code to evaluate report of quiz
        const quizQuestions = get(input, 'quizQuestions');
        let questionIdsQuery = '[';
        if (quizAction === userActionType.next &&
          quizQuestions.length) {
          quizQuestions.forEach((quizQuestion) => {
            const questionId = get(quizQuestion, 'question.typeId');
            if (questionId) {
              questionIdsQuery += `"${questionId}", `;
            }
          });
          questionIdsQuery += ']';
          // getting questions from question bank to evaluate quiz report
          const questionBankQuery = `
            query{
              questionBanks(filter:{
                id_in: ${questionIdsQuery}
              }){
                id
                order
                questionType
                mcqOptions{
                  statement
                  isCorrect
                }
                fibInputOptions{
                  answers
                  correctPosition
                }
                fibBlocksOptions{
                  statement
                  correctPositions
                }
                arrangeOptions{
                  statement
                  correctPosition
                }
                learningObjective{
                  id
                }
              }
            }
            `;
          const questionBankQueryRes = await callGraphqlApi(questionBankQuery);
          const questionBankInfo = get(questionBankQueryRes, 'data.questionBanks');
          const learningObjectiveReportObject = {};
          // Initializing quiz report
          const quizReport = {};
          quizReport.totalQuestionCount = 0;
          quizReport.correctQuestionCount = 0;
          quizReport.inCorrectQuestionCount = 0;
          quizReport.unansweredQuestionCount = 0;
          const loArray = [];
          let pushManyQuery = 'quiz:{ pushMany: [';
          quizQuestions.forEach((quizQuestion) => {
            const currentQuestionId = get(quizQuestion, 'question.typeId');
            questionBankInfo.forEach((questionBank) => {
              const questionBankId = get(questionBank, 'id');
              // iterating over questions from input and question bank and
              // comparing for same question and evaluating if it is correct
              if (currentQuestionId === questionBankId) {
                quizReport.totalQuestionCount += 1;
                pushManyQuery += `{ questionConnectId: "${currentQuestionId}", `;
                const questionType = get(questionBank, 'questionType');
                const isAttempted = get(quizQuestion, 'isAttempted');
                if (isAttempted) {
                  pushManyQuery += `isAttempted: ${isAttempted}, `;
                }
                const questionDisplayOrder = get(quizQuestion, 'questionDisplayOrder');
                if (questionDisplayOrder) {
                  pushManyQuery += `questionDisplayOrder: ${questionDisplayOrder}, `;
                }
                const loId = get(questionBank, 'learningObjective.id');
                // initializing learning objective report it is not already populated
                if (!learningObjectiveReportObject[loId]) {
                  loArray.push(loId);
                  learningObjectiveReportObject[loId] = {};
                  learningObjectiveReportObject[loId].totalQuestionCount = 0;
                  learningObjectiveReportObject[loId].correctQuestionCount = 0;
                  learningObjectiveReportObject[loId].inCorrectQuestionCount = 0;
                  learningObjectiveReportObject[loId].unansweredQuestionCount = 0;
                  learningObjectiveReportObject[loId].learningObjective = loId;
                }
                const userMcqAnswers = get(quizQuestion, 'userMcqAnswer');
                const mcqOptions = get(questionBank, 'mcqOptions');
                const userFibBlockAnswers = get(quizQuestion, 'userFibBlockAnswer');
                const fibBlocksOptions = get(questionBank, 'fibBlocksOptions');
                const userFibInputAnswers = get(quizQuestion, 'userFibInputAnswer');
                const fibInputOptions = get(questionBank, 'fibInputOptions');
                const userArrangeAnswers = get(quizQuestion, 'userArrangeAnswer');
                const arrangeOptions = get(questionBank, 'arrangeOptions');
                let isCorrect;
                let userStatement;
                let isOptionSelected;
                let statement;
                let isOptionCorrect;
                let userStatementPosition;
                let optionCorrectPositions;
                let optionPosition;
                let userAnswer;
                let answers;
                // checking question type and checking for correctness
                switch (questionType) {
                  case questionTypes.mcq:
                    if (mcqOptions) {
                      isCorrect = true;
                      let userMcqQuery = 'userMcqAnswer: [';
                      let mcqOptionQuery = 'mcqOptions: [';
                      mcqOptions.forEach((mcqOption) => {
                        statement = get(mcqOption, 'statement');
                        isOptionCorrect = get(mcqOption, 'isCorrect');
                        userMcqAnswers.forEach((userMcqAnswer) => {
                          if (isAttempted && userMcqAnswers) {
                            userStatement = get(userMcqAnswer, 'statement');
                            isOptionSelected = get(userMcqAnswer, 'isSelected');
                            if (userStatement === statement) {
                              userMcqQuery += `{statement: "${userStatement}", `;
                              userMcqQuery += `isSelected: ${isOptionSelected}}, `;
                              if (isOptionSelected !== isOptionCorrect) { isCorrect = false; }
                            }
                          } else {
                            isCorrect = false;
                          }
                        });
                        mcqOptionQuery += `{statement: "${statement}", `;
                        mcqOptionQuery += `isCorrect: ${isOptionCorrect}}, `;
                      });
                      userMcqQuery += ']';
                      mcqOptionQuery += ']';
                      pushManyQuery += `isCorrect: ${isCorrect},
                                          ${userMcqQuery}
                                          ${mcqOptionQuery}
                                         `;
                    }
                    break;
                  case questionTypes.fibBlock:
                    if (fibBlocksOptions) {
                      isCorrect = true;
                      let userFibBlockQuery = 'userFibBlockAnswer: [';
                      let fibBlockOptionQuery = 'fibBlocksOptions: [';
                      fibBlocksOptions.forEach((fibBlocksOption) => {
                        statement = get(fibBlocksOption, 'statement');
                        optionCorrectPositions = get(fibBlocksOption, 'correctPositions');
                        userFibBlockAnswers.forEach((userFibBlockAnswer) => {
                          if (isAttempted && userFibBlockAnswers) {
                            userStatement = get(userFibBlockAnswer, 'statement');
                            userStatementPosition = get(userFibBlockAnswer, 'position');
                            if (userStatement === statement) {
                              userFibBlockQuery += `{statement: "${userStatement}", `;
                              userFibBlockQuery += `position: ${userStatementPosition}}, `;
                              if (optionCorrectPositions.indexOf(userStatementPosition) === -1) {
                                isCorrect = false;
                              }
                            }
                          } else {
                            isCorrect = false;
                          }
                        });
                        let correctPositionsQuery = '[';
                        optionCorrectPositions.forEach((optionCorrectPosition) => {
                          correctPositionsQuery += `${optionCorrectPosition}, `;
                        });
                        correctPositionsQuery += ']';
                        fibBlockOptionQuery += `{statement: "${statement}", `;
                        fibBlockOptionQuery += `correctPositions: ${correctPositionsQuery}}, `;
                      });
                      userFibBlockQuery += ']';
                      fibBlockOptionQuery += ']';
                      pushManyQuery += `isCorrect: ${isCorrect},
                                          ${userFibBlockQuery}
                                          ${fibBlockOptionQuery}
                                         `;
                    }
                    break;
                  case questionTypes.fibInput:
                    if (fibInputOptions) {
                      isCorrect = true;
                      let userFibInputQuery = 'userFibInputAnswer: [';
                      let fibInputOptionQuery = 'fibInputOptions: [';
                      fibInputOptions.forEach((fibInputOption) => {
                        answers = get(fibInputOption, 'answers');
                        optionPosition = get(fibInputOption, 'correctPosition');
                        userFibInputAnswers.forEach((userFibInputAnswer) => {
                          if (isAttempted && userFibInputAnswers) {
                            userAnswer = get(userFibInputAnswer, 'answer');
                            userStatementPosition = get(userFibInputAnswer, 'position');
                            if (userStatementPosition === optionPosition) {
                              userFibInputQuery += `{answer: "${userAnswer}", `;
                              userFibInputQuery += `position: ${userStatementPosition}}, `;
                              if (answers.indexOf(userAnswer) === -1) {
                                isCorrect = false;
                              }
                            }
                          } else {
                            isCorrect = false;
                          }
                        });
                        let answersQuery = '[';
                        answers.forEach((answer) => {
                          answersQuery += `"${answer}", `;
                        });
                        answersQuery += ']';
                        fibInputOptionQuery += `{correctPosition: ${optionPosition}, `;
                        fibInputOptionQuery += `answers: ${answersQuery}}, `;
                      });
                      userFibInputQuery += ']';
                      fibInputOptionQuery += ']';
                      pushManyQuery += `isCorrect: ${isCorrect},
                                          ${userFibInputQuery}
                                          ${fibInputOptionQuery}
                                         `;
                    }
                    break;
                  case questionTypes.arrange:
                    if (arrangeOptions) {
                      isCorrect = true;
                      let userArrangeQuery = 'userArrangeAnswer: [';
                      let arrangeOptionsQuery = 'arrangeOptions: [';
                      arrangeOptions.forEach((arrangeOption) => {
                        statement = get(arrangeOption, 'statement');
                        optionPosition = get(arrangeOption, 'correctPosition');
                        userArrangeAnswers.forEach((userArrangeAnswer) => {
                          if (isAttempted && userArrangeAnswers) {
                            userStatement = get(userArrangeAnswer, 'statement');
                            userStatementPosition = get(userArrangeAnswer, 'position');
                            if (userStatement === statement) {
                              userArrangeQuery += `{statement: "${userStatement}", `;
                              userArrangeQuery += `order: ${userStatementPosition}}, `;
                              if (userStatementPosition !== optionPosition) { isCorrect = false; }
                            }
                          } else {
                            isCorrect = false;
                          }
                        });
                        arrangeOptionsQuery += `{statement: "${statement}", `;
                        arrangeOptionsQuery += `correctPosition: ${optionPosition}}, `;
                      });
                      userArrangeQuery += ']';
                      arrangeOptionsQuery += ']';
                      pushManyQuery += `isCorrect: ${isCorrect},
                                          ${userArrangeQuery}
                                          ${arrangeOptionsQuery}
                                         `;
                    }
                    break;
                  default:
                }
                pushManyQuery += '}, ';
                // calculating quiz report lo wise and topic wise on basis of
                // isAttempted and isCorrect
                learningObjectiveReportObject[loId].totalQuestionCount += 1;
                if (!isAttempted) {
                  learningObjectiveReportObject[loId].unansweredQuestionCount += 1;
                  quizReport.unansweredQuestionCount += 1;
                }
                if (isCorrect) {
                  learningObjectiveReportObject[loId].correctQuestionCount += 1;
                  quizReport.correctQuestionCount += 1;
                }
                if (isAttempted && !isCorrect) {
                  learningObjectiveReportObject[loId].inCorrectQuestionCount += 1;
                  quizReport.inCorrectQuestionCount += 1;
                }
                // commented code for calculating quiz lo report accuracy
                // const loTotalQuestionCount =
                // learningObjectiveReportObject[loId].totalQuestionCount;
                // const loCorrectQuestionCount =
                //   learningObjectiveReportObject[loId].correctQuestionCount;
                // if (loTotalQuestionCount > 0) {
                //   learningObjectiveReportObject[loId].accuracy =
                //     (loCorrectQuestionCount / loTotalQuestionCount) * 100;
                // }
              }
            });
          });
          const quizReportQuery = `quizReport:{
                                    totalQuestionCount: ${quizReport.totalQuestionCount}
                                    inCorrectQuestionCount: ${quizReport.inCorrectQuestionCount}
                                    correctQuestionCount: ${quizReport.correctQuestionCount}
                                    unansweredQuestionCount: ${quizReport.unansweredQuestionCount}
                                  }`;
          let learningObjectiveReportQuery = 'learningObjectiveReport: [';
          // creating lo report query on basis of objects in loArray
          loArray.forEach((loIdInArray) => {
            learningObjectiveReportQuery += `{
                                    totalQuestionCount: ${learningObjectiveReportObject[loIdInArray].totalQuestionCount}
                                    inCorrectQuestionCount: ${learningObjectiveReportObject[loIdInArray].inCorrectQuestionCount}
                                    correctQuestionCount: ${learningObjectiveReportObject[loIdInArray].correctQuestionCount}
                                    unansweredQuestionCount: ${learningObjectiveReportObject[loIdInArray].unansweredQuestionCount}
                                    learningObjectiveConnectId: "${loIdInArray}"
                                  }, `;
          });
          learningObjectiveReportQuery += ']';
          pushManyQuery += ']}';
          let popAllQuery = '';
          // popping all the existing value present in quiz
          popAllQuery = `quiz:{
                     popAll: true
                   }`;

          if (userQuizId) {
            // popping all the existing value present in quiz
            const updateUserQuizMutation = `
            mutation{
              updateUserQuiz(id:"${userQuizId}",  input:{
                quizStatus: ${userComponentStatus.complete}
                ${popAllQuery}
              }){
                id
              }
            }
            `;
            await callGraphqlApi(updateUserQuizMutation);

            // pushing all the questions with result in the collection
            const updateUserQuizMutationQuiz = `
              mutation{
                updateUserQuiz(id:"${userQuizId}",  input:{
                  ${pushManyQuery}
                }){
                  id
                }
              }
              `;
            await callGraphqlApi(updateUserQuizMutationQuiz);

            // generating quiz report of user
            const addUserQuizReport = `
              mutation{
                addUserQuizReport(
                userConnectId: "${userId}"
                topicConnectId: "${topicId}"
                input:{
                  ${quizReportQuery}
                  ${learningObjectiveReportQuery}
                }){
                  id
                }
              }
              `;
            await callGraphqlApi(addUserQuizReport);

            // logic for evaluating scholarship of user
            // and it will be done on first attempt of quiz
            if (currentComponent === componentTypes.quiz &&
              currentTopic.id === topicId) {
              // code for calculating total quiz report accuracy for scholarship
              const totalQuestionCount = quizReport.totalQuestionCount;
              const correctQuestionCount = quizReport.correctQuestionCount;
              let topicsCompleted = 0;
              let proficientTopicCount = 0;
              let masteredTopicCount = 0;
              let familiarTopicCount = 0;
              let freeProficientTopicCount = freeTopicCount;
              let freeMasteredTopicCount = freeTopicCount;
              let freeFamiliarTopicCount = freeTopicCount;
              let accuracy = 0;
              if (totalQuestionCount > 0) {
                accuracy =
                  (correctQuestionCount / totalQuestionCount) * 100;
              }
              const userProfileQuery = `
              query{
                userProfiles(filter:{
                  user_some:{
                    id: "${userId}"
                  }
                }){
                  id
                  topicsCompleted
                  proficientTopicCount
                  freeProficientTopicCount
                  masteredTopicCount
                  freeMasteredTopicCount
                  familiarTopicCount
                  freeFamiliarTopicCount
                }
              }
            `;
              const userProfileResult = await callGraphqlApi(userProfileQuery);
              const userProfileInfo = get(userProfileResult, 'data.userProfiles[0]');
              const userProfileId = get(userProfileInfo, 'id');
              if (userProfileInfo && userProfileInfo.topicsCompleted) {
                topicsCompleted = userProfileInfo.topicsCompleted;
              }
              if (userProfileInfo && userProfileInfo.proficientTopicCount) {
                proficientTopicCount = userProfileInfo.proficientTopicCount;
              }
              if (userProfileInfo && userProfileInfo.freeProficientTopicCount) {
                freeProficientTopicCount = userProfileInfo.freeProficientTopicCount;
              }
              if (userProfileInfo && userProfileInfo.masteredTopicCount) {
                masteredTopicCount = userProfileInfo.masteredTopicCount;
              }
              if (userProfileInfo && userProfileInfo.freeMasteredTopicCount) {
                freeMasteredTopicCount = userProfileInfo.freeMasteredTopicCount;
              }
              if (userProfileInfo && userProfileInfo.familiarTopicCount) {
                familiarTopicCount = userProfileInfo.familiarTopicCount;
              }
              if (userProfileInfo && userProfileInfo.freeFamiliarTopicCount) {
                freeFamiliarTopicCount = userProfileInfo.freeFamiliarTopicCount;
              }
              let userProfileTopicConnectQuery = '';
              topicsCompleted += 1;
              // proficient topic logic
              if (accuracy === scholarshipThreshHolds.proficient) {
                proficientTopicCount += 1;
                userProfileTopicConnectQuery += `proficientTopicsConnectIds:["${topicId}"] `;
              } else if (freeProficientTopicCount > 0) {
                freeProficientTopicCount -= 1;
              }
              // mastered topic logic
              if (accuracy > scholarshipThreshHolds.master) {
                masteredTopicCount += 1;
                userProfileTopicConnectQuery += `masteredTopicsConnectIds:["${topicId}"] `;
              } else if (freeMasteredTopicCount > 0) {
                freeMasteredTopicCount -= 1;
              }
              // familiar topic logic
              if (accuracy > scholarshipThreshHolds.familiar) {
                familiarTopicCount += 1;
                userProfileTopicConnectQuery += `familiarTopicsConnectIds:["${topicId}"] `;
              } else if (freeFamiliarTopicCount > 0) {
                freeFamiliarTopicCount -= 1;
              }

              if (userProfileId) {
                const updateUserProfile = `
                mutation{
                  updateUserProfile(id:"${userProfileId}"
                  ${userProfileTopicConnectQuery}
                    input:{
                      topicsCompleted: ${topicsCompleted}
                      proficientTopicCount: ${proficientTopicCount}
                      freeProficientTopicCount: ${freeProficientTopicCount}
                      masteredTopicCount: ${masteredTopicCount}
                      freeMasteredTopicCount: ${freeMasteredTopicCount}
                      familiarTopicCount: ${familiarTopicCount}
                      freeFamiliarTopicCount: ${freeFamiliarTopicCount}
                    }
                  ){
                   id 
                  }
                }
                `;
                await callGraphqlApi(updateUserProfile);
              } else {
                const addUserProfile = `
                  mutation{
                    addUserProfile(
                      userConnectId:"${userId}"
                      ${userProfileTopicConnectQuery}
                      input:{
                        topicsCompleted: ${topicsCompleted}
                        proficientTopicCount: ${proficientTopicCount}
                        freeProficientTopicCount: ${freeProficientTopicCount}
                        masteredTopicCount: ${masteredTopicCount}
                        freeMasteredTopicCount: ${freeMasteredTopicCount}
                        familiarTopicCount: ${familiarTopicCount}
                        freeFamiliarTopicCount: ${freeFamiliarTopicCount}
                      }){
                      id
                    }
                  }
                  `;
                await callGraphqlApi(addUserProfile);
              }
            }
          }
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

import { get } from 'lodash';
import {
  OLD_COURSE_ID,
  userActionType,
  userTopicTypeStatus,
} from '../../../../constants';
import { log } from '../../../../utils';
import {
  DatabaseRecordNotFoundError,
  PracticeQuestionsNotPresentError,
} from '../../../../constants/errors';
import updateCurrentComponentStatusOfNewCourse from './utils/updateCurrentComponentStatusOfNewCourse';
import updateCurrentComponentStatus from './utils/updateCurrentComponentStatus';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import topicComponentRuleQuery from './utils/topicComponentRuleQuery';

/* query to get userLO to check if document exists for userId and learningObjectiveId
also we are doing computation for chatStatus and next component for this */
const userLearningObjectiveQuery = (userId, learningObjectiveId, courseId) => `
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
      practiceQuestionStatus
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
      }
      practiceQuestions{
        question{
          id
        }
        isHintUsed
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

// mutation to update User Learning Objective, popping all practice questions
const updateUserLearningObjectiveMutation = (
  userLearningObjectiveId,
  isPracticeQuestionBookmarked,
  practiceQuestionStatus,
  popAllQuery,
) => `
  mutation{
    updateUserLearningObjective(id:"${userLearningObjectiveId}",  input:{
      ${typeof isPracticeQuestionBookmarked === 'boolean' ? `isPracticeQuestionBookmarked: ${isPracticeQuestionBookmarked}` : ''}
      practiceQuestionStatus: ${practiceQuestionStatus}
      ${popAllQuery}
    }){
      id
    }
  }
  `;

// mutation to update User Learning Objective, pushing updated practice questions
const updateUserLearningObjectiveMutationPracticeQuestions = (
  userLearningObjectiveId, pushManyQuery,
) => `
  mutation{
    updateUserLearningObjective(id:"${userLearningObjectiveId}",  input:{
      ${pushManyQuery}
    }){
      id
    }
  }
  `;

// mutation to add UserPracticeQuestionReport
const addUserPracticeQuestionReportMutation = (
  userId,
  learningObjectiveId,
  courseId,
) => `
  mutation addUserPracticeQuestionReport($input: UserPracticeQuestionReportInput!){
    addUserPracticeQuestionReport(
    userConnectId:"${userId}"
    learningObjectiveConnectId:"${learningObjectiveId}"
    ${courseId ? `courseConnectId:"${courseId}"` : ''}
    input: $input
  ){
      id
    }
  }
  `;

// mutation to update UserPracticeQuestionReport
const updateUserPracticeQuestionReportMutation = (
  pqReportId,
) => `
  mutation($input: UserPracticeQuestionReportUpdate) {
  updateUserPracticeQuestionReport(id: "${pqReportId}", input: $input) {
    id
  }
}
  `;
// get UserPracticeQuestionReport
const getUserPracticeQuestionReportQuery = (
  userId,
  learningObjectiveId,
  courseId,
) => `
  {
  userPracticeQuestionReports(filter:{
    and:[
      {
        user_some:{id:"${userId}"}
      }
      {
        course_some:{
          id:"${courseId}"
        }
      }
      {
        learningObjective_some:{
          id:"${learningObjectiveId}"
        }
      }
    ]
  }){
    id
  }
}
  `;
/*
Current topic component status and
UserLearningObjective(bookmark, practiceQuestionStatus etc) is updated based on-
  -current topic component status
  -user Learning Objective for provided userId and learning objective id
  -learning objectives and topic
*/
const addUserActivityPQDumpPostHookMethod = async (input, mutationName, context) => {
  const userId = get(input, 'user.typeId');
  const learningObjectiveId = get(input, 'learningObjective.typeId');
  const courseId = get(input, 'course.typeId');
  if (!userId || !learningObjectiveId) {
    log('Either one of userId or learningObjectiveId is missing in input of addUserActivityPQDumpPostHookMethod');
  }
  const learningObjectiveInfo = get(context, `${mutationName}.learningObjective`);
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
  /*
  we are getting userLearningObjective for below purpose:
  -we get userLearningObjective id , which will be used further to update the document
  -we use practiceQuestionStatus to cover the scenario, if user is coming back to a completed pq
    in that case if he is hitting back after pq consumption, status will not get updated
    if it is already completed
  -we get next component from the document and update user current topic component status with same
  */
  const userLearningObjectiveQueryRes = await callLocalGraphqlApi(
    userLearningObjectiveQuery(userId, learningObjectiveId, courseId),
  );
  const userLearningObjectiveInfo = get(userLearningObjectiveQueryRes, 'data.userLearningObjectives[0]');
  const {
    id: userLearningObjectiveId,
    practiceQuestionStatus: practiceQuestionStatusBeforeUpdate,
  } = userLearningObjectiveInfo;
  const topicComponentRule = get(userLearningObjectiveInfo, 'learningObjective.topics[0].topicComponentRule', null) || get(userLearningObjectiveInfo, 'learningObjective.topic.topicComponentRule', []);
  const topicOrder = get(userLearningObjectiveInfo, 'learningObjective.topics[0].order', null) || get(userLearningObjectiveInfo, 'learningObjective.topic.order');
  const { next, skip } = userActionType;
  const { complete, incomplete, skip: skipStatus } = userTopicTypeStatus;
  let practiceQuestionStatus = get(userLearningObjectiveInfo, 'practiceQuestionStatus', incomplete);
  const {
    pqAction,
    isBookmarked: isPracticeQuestionBookmarked,
    practiceQuestionsDump: inputPracticeQuestions,
  } = input;
  // initializing fields for user PQ report
  let firstTryCount = 0;
  let secondTryCount = 0;
  let threeOrMoreTryCount = 0;
  let helpUsedCount = 0;
  let answerUsedCount = 0;
  let completedQuestionCount = 0;
  const detailedReport = [];
  /*
  creating push many query which will be used while updating userLearningObjective
  it will contain all info about practice questions(isHintUsed, isAnswerUser, try count etc.)
  based on input sent by client in array of objects
  */
  const practiceQuestionsInUserLearningObjective = get(userLearningObjectiveInfo, 'practiceQuestions');
  if (!inputPracticeQuestions || !inputPracticeQuestions.length) {
    log('PracticeQuestions are not present in input in addUserActivityPQDumpPostHookMethod');
    throw new PracticeQuestionsNotPresentError();
  }
  if (!practiceQuestionsInUserLearningObjective
    || !practiceQuestionsInUserLearningObjective.length) {
    log('PracticeQuestions are not present in UserLearningObjective in addUserActivityPQDumpPostHookMethod');
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'LearningObjective.PracticeQuestions: is not present',
      },
    });
  }
  const totalQuestions = practiceQuestionsInUserLearningObjective.length;
  let pushManyQuery = 'practiceQuestions:{ pushMany: [';
  /*
  We get practiceQuestions from UserLearningObjective and iterate on each one of them and
  update the same on the basis of question's status and whole PQ status and PQ from input.
  */
  practiceQuestionsInUserLearningObjective.forEach(
    (practiceQuestionInUserLearningObjective) => {
      // storing all the passed info in input in newPracticeQuestionInUserLearningObjective
      const {
        question,
        ...newPracticeQuestionInUserLearningObjective
      } = practiceQuestionInUserLearningObjective;
      const questionConnectId = get(practiceQuestionInUserLearningObjective, 'question.id');
      const { status: pqStatusInUserLearningObjective } = practiceQuestionInUserLearningObjective;
      pushManyQuery += `{ questionConnectId: "${questionConnectId}", `;
      /*
      Iterating over each practice question from input and will update question in
      userLearningobjective on basis of input(isCorrect, isHIntUsed, attemptNumber etc.)
      */
      inputPracticeQuestions.forEach((inputPracticeQuestion) => {
        const inputQuestionConnectId = get(inputPracticeQuestion, 'question.typeId');
        const {
          isCorrect,
          isHintUsed,
          isAnswerUsed,
          attemptNumber,
          questionAction,
          startTime,
          endTime,
        } = inputPracticeQuestion;
        /*
        As we are iterating over each question from userLearningObjective and input
        So, checking here for same question in both
        */
        if (questionConnectId === inputQuestionConnectId) {
          detailedReport.push({
            questionConnectId,
            isCorrect,
            isAnswerUsed,
            isHintUsed,
            firstTry: attemptNumber === 1,
            secondTry: attemptNumber === 2,
            thirdOrMoreTry: attemptNumber > 2,
            attemptNumber,
          });
          Object.assign(newPracticeQuestionInUserLearningObjective, { questionConnectId });
          /*
          Case: When individual question is incomplete and whole PQ is also incomplete.
          In that case user first attempt to correct the question is considered.
          Case example: user attempts and answers 2 PQ out of total 5 PQs and closes app.
          In this case when he comes back the status of 2 attempted question in already complete.
          Now, the status will not change for these 2 questions until the wholePQ is completed
          even he decide to re-answer them
          */
          if ((practiceQuestionStatusBeforeUpdate === incomplete
              || practiceQuestionStatusBeforeUpdate === skip
          )
              && pqStatusInUserLearningObjective === incomplete
          ) {
            if (isHintUsed === true) {
              Object.assign(newPracticeQuestionInUserLearningObjective, { isHintUsed });
            }
            if (isAnswerUsed === true) {
              Object.assign(newPracticeQuestionInUserLearningObjective, { isAnswerUsed });
            }
            if (questionAction === next && isCorrect === true) {
              const status = complete;
              Object.assign(newPracticeQuestionInUserLearningObjective, { status });
            }
            if (isCorrect === true && attemptNumber) {
              Object.assign(newPracticeQuestionInUserLearningObjective, { attemptNumber });
            }
            /*
            Case: when whole PQ is already completed and user is reattempting
            In this case the question user reattempts will get updated with new values
            rest of the questions will remain same if user skips them.
            */
          } else if (practiceQuestionStatus === complete
                  && pqStatusInUserLearningObjective === complete) {
            Object.assign(newPracticeQuestionInUserLearningObjective, { isHintUsed });
            Object.assign(newPracticeQuestionInUserLearningObjective, { isAnswerUsed });
            if (isCorrect === true && attemptNumber) {
              Object.assign(newPracticeQuestionInUserLearningObjective, { attemptNumber });
            }
          }
          if (startTime) {
            Object.assign(newPracticeQuestionInUserLearningObjective, { startTime });
          }
          if (endTime) {
            Object.assign(newPracticeQuestionInUserLearningObjective, { endTime });
          }
        }
      });
      /*
      creating query which will be sent in UserLearningObjective on basis of ifno stored
      in newPracticeQuestionInUserLearningObjective
      */
      const {
        isHintUsed: updatedIsHintUsed,
        isAnswerUsed: updatedIsAnswerUsed,
        attemptNumber: updatedAttemptNumber,
        status: updatedStatus,
        startTime: updatedStartTime,
        endTime: updatedEndTime,
      } = newPracticeQuestionInUserLearningObjective;
      /*
      Storing count of all questions in completed state. We will use this in validating
      whether user current topic status should change. It will only change if all questions are
      in completed state and user hits next
      */
      if (updatedStatus === complete) {
        completedQuestionCount += 1;
      }
      // adding each upadated question in push many query
      pushManyQuery += `isHintUsed: ${updatedIsHintUsed}, 
                                               isAnswerUsed: ${updatedIsAnswerUsed}, 
                                               attemptNumber: ${updatedAttemptNumber}, 
                                               status: ${updatedStatus},
                                               ${updatedStartTime ? `startTime: "${updatedStartTime}"` : ''}
                                               ${updatedEndTime ? `endTime: "${updatedEndTime}"` : ''}
                                              }, `;

      /*
      These properties will be used in UserPracticeQuestionReport
      PQ report will only be generated when user hits next
      And a new PQ report will be created every time users hits next
      */
      if (pqAction === next) {
        if (updatedIsHintUsed) helpUsedCount += 1;
        if (updatedIsAnswerUsed) answerUsedCount += 1;
        if (updatedAttemptNumber === 1) {
          firstTryCount += 1;
        } else if (updatedAttemptNumber === 2) {
          secondTryCount += 1;
        } else {
          threeOrMoreTryCount += 1;
        }
      }
    },
  );
  pushManyQuery += ']}';
  const popAllQuery = `practiceQuestions:{
                     popAll: true
                   }`;

  // check if all PQ questions are sent in input in case pq action is "next"
  if (pqAction && pqAction === next && (!get(context, 'fromAddUserLSDump', false) && (completedQuestionCount !== totalQuestions))) {
    log('PracticeQuestions are not present in input in addUserActivityPQDumpPostHookMethod');
    throw new PracticeQuestionsNotPresentError();
  }

  // practiceQuestionStatus will change to complete if user hits next
  if (pqAction && pqAction === next && completedQuestionCount === totalQuestions) {
    practiceQuestionStatus = complete;
  } else if (pqAction && pqAction === skip) {
    practiceQuestionStatus = skipStatus;
  }
  // if existing practiceQuestionStatus is complete, it will remain complete
  if (userLearningObjectiveInfo
    && practiceQuestionStatusBeforeUpdate === complete) {
    practiceQuestionStatus = complete;
  }
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
  if (!courseId || (courseId === OLD_COURSE_ID)) {
    await updateCurrentComponentStatus(
      currentTopicComponentInfo,
      pqAction,
      topicId,
      learningObjectiveIdInResult,
      'practiceQuestion',
      nextComponentType,
      completedQuestionCount,
      totalQuestions,
      nextComponentLearningObjectiveId,
    );
  } else {
    await updateCurrentComponentStatusOfNewCourse(
      courseId,
      currentTopicComponentInfo,
      pqAction,
      topicId,
      learningObjectiveIdInResult,
      '',
      '',
      'practiceQuestion',
      topicComponentRule,
      topicOrder,
      completedQuestionCount,
      totalQuestions,
    );
  }
  // popping all the practice questions and sending rest of the fields for update
  await callLocalGraphqlApi(updateUserLearningObjectiveMutation(
    userLearningObjectiveId,
    isPracticeQuestionBookmarked,
    practiceQuestionStatus,
    popAllQuery,
  ));
  // pushing new array of objects(updated questions)
  await callLocalGraphqlApi(updateUserLearningObjectiveMutationPracticeQuestions(
    userLearningObjectiveId,
    pushManyQuery,
  ));
  const pqReportInput = {
    firstTryCount,
    secondTryCount,
    threeOrMoreTryCount,
    helpUsedCount,
    answerUsedCount,
    detailedReport,
  };
  if (get(context, 'fromAddUserLSDump')) {
    const pqReport = await callLocalGraphqlApi(getUserPracticeQuestionReportQuery(userId, learningObjectiveIdInResult, courseId));
    if (get(pqReport, 'data.userPracticeQuestionReports', []).length) {
      // if exist update pqReport
      Object.assign(pqReportInput, {
        detailedReport: {
          replace: detailedReport,
        },
      });
      await callLocalGraphqlApi(updateUserPracticeQuestionReportMutation(get(pqReport, 'data.userPracticeQuestionReports[0].id')), context, {
        input: pqReportInput,
      });
    } else {
      // adding pqReport
      await callLocalGraphqlApi(addUserPracticeQuestionReportMutation(
        userId,
        learningObjectiveIdInResult,
        courseId,
      ), context, {
        input: pqReportInput,
      });
    }
    return true;
  }
  // PQ report will be generated every time when user hits next
  if (pqAction === next && completedQuestionCount === totalQuestions) {
    await callLocalGraphqlApi(addUserPracticeQuestionReportMutation(
      userId,
      learningObjectiveIdInResult,
      courseId,
    ), context, {
      input: pqReportInput,
    });
  }
  return true;
};

export default addUserActivityPQDumpPostHookMethod;

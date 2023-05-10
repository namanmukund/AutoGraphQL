import { get } from 'lodash';
import {
  PUBLISHED,
  topicTypes,
} from '../../../../constants';
import getInfoFromParams from './utils/getInfoFromParams';
import parseTopicComponentResultData from './utils/parseTopicComponentResultData';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import { fetchAndCacheQueryRes } from '../resolvers/mutation/userData/menteeCourseSyllabus';
import deleteCreatedDocs from './utils/deleteCreatedDocs';
import { checkIfRoleCmsAdmin } from '../../../../utils/ifAuthorized';

// query to get learning objective and all the learning objectives of the topic associated
const learningObjectiveQuery = (learningObjectiveId) => `
  query{
    learningObjective(id:"${learningObjectiveId}"){
      id
      order
      questionBank(filter:{
        and:[
          {
            assessmentType:${topicTypes.practiceQuestion}
          },
          {
            status: ${PUBLISHED}
          }
        ]
      }){
        id
      }
      learningSlides(filter:{status:${PUBLISHED}}, orderBy:order_ASC,){
        id
      }
    }
  }
  `;

// query to add User LO if it is not already present for user and LO id
const addUserLearningObjectiveMutation = (
  userId,
  learningObjectiveId,
  practiceQuestionsQuery,
  courseId,
  learningSlidesQuery,
  topicId,
) => `
  mutation{
    addUserLearningObjective(
    userConnectId:"${userId}"
    learningObjectiveConnectId:"${learningObjectiveId}"
    ${courseId ? `courseConnectId:"${courseId}"` : ''}
    ${topicId ? `topicConnectId:"${topicId}"` : ''}
    input:{
        ${practiceQuestionsQuery}
        ${learningSlidesQuery}
    }
    ){
      id
      user{
        id
      }
      learningObjective{
        id
      }
      practiceQuestions {
        question {
          id
          order
        }
        status
        isHintUsed
        isAnswerUsed
        attemptNumber
      }
       learningSlides {
        learningSlide {
          id
          order
        }
        status
      }
      chatStatus
      isChatBookmarked
      practiceQuestionStatus
      isPracticeQuestionBookmarked
    }
    }
    `;
/*
if userLO document does not exist for provided combination of user id and LO id.
It will be created and returned.
Document contains all the necessary information needed on page along
with the next component.
*/
const userLearningObjectivePostHookMethod = async (input, params, _mutationName, context) => {
  /*
  checking if document is already present in collection for user and LO id,
  returning input in that case
  if it is not already present, we will add a new document with default data
  */
  const isRoleCmsAdmin = checkIfRoleCmsAdmin(context);
  if (isRoleCmsAdmin && input && input.length) {
    await deleteCreatedDocs(_mutationName, input, context);
  }
  if (input && input.length && !isRoleCmsAdmin) {
    return input;
  }
  const resultArray = [];
  /*
    we are getting below fields in learningObjectiveQuery:
    -topic and it's next LO if present, which will be populated in nextComponent
    -all published practice questions of the LO
    */
  const {
    userId,
    learningObjectiveId,
    courseId,
    topicId,
  } = getInfoFromParams(params, 'learningObjective');
  // In case there is no learning objective id, empty data will be sent
  if (!learningObjectiveId) {
    return resultArray;
  }
  const learningObjectiveQueryRes = await fetchAndCacheQueryRes({
    hkey: `static::learningObjective::${learningObjectiveId}`,
    maxAge: 604800,
    dbCallback: () => callLocalGraphqlApi(learningObjectiveQuery(learningObjectiveId), context),
  });
  const learningObjectiveInfo = get(learningObjectiveQueryRes, 'data.learningObjective');
  const {
    questionBank: practiceQuestionsInLO,
    learningSlides: learningSlidesInLO,
  } = learningObjectiveInfo;
  // adding PQs to the userLearningObjective document
  let practiceQuestionsQuery = '';
  if (learningObjectiveInfo && practiceQuestionsInLO && practiceQuestionsInLO.length) {
    practiceQuestionsQuery = 'practiceQuestions:[';
    practiceQuestionsInLO.forEach((practiceQuestion) => {
      const { id: practiceQuestionId } = practiceQuestion;
      practiceQuestionsQuery += `{ questionConnectId: "${practiceQuestionId}" }, `;
    });
    practiceQuestionsQuery += ']';
  }
  let learningSlidesQuery = '';
  if (learningObjectiveInfo && learningSlidesInLO && learningSlidesInLO.length) {
    learningSlidesQuery = 'learningSlides:[';
    learningSlidesInLO.forEach((learningSlide) => {
      const { id: learningSlideId } = learningSlide;
      learningSlidesQuery += `{ learningSlideConnectId: "${learningSlideId}" }, `;
    });
    learningSlidesQuery += ']';
  }

  /*
    adding addUserLearningObjective document on the basis of
    restQuery(next component data), practiceQuestionsQuery(published practice questions of LO)
    */
  const result = await callLocalGraphqlApi(
    addUserLearningObjectiveMutation(
      userId,
      learningObjectiveId,
      practiceQuestionsQuery,
      courseId,
      learningSlidesQuery,
      topicId,
    ),
    context,
  );
  if (result) {
    /*
      parsing data 'addUserLearningObjective' so that the logic implemented ahead can read data is
      desired format and return the same.
      Example: suppose client has asked for title and order of learningObjective,
      In that case he will get title and order only. And this is happening when we parse
      data as below. If parsing is not done, it is returning empty data.
      And here we have not parsed data for practice questions because userLO will be created
      when user attempts chat, and he will not need PQ there.
      */
    const addUserLearningObjectiveResult = get(result, 'data.addUserLearningObjective');
    if (addUserLearningObjectiveResult) {
      resultArray.push(parseTopicComponentResultData(addUserLearningObjectiveResult, 'learningObjective'));
    }
  }
  return resultArray;
};

export default userLearningObjectivePostHookMethod;

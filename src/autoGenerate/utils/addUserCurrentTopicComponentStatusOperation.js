import { get } from 'lodash';
import addUserCurrentTopicComponentStatus from './addUserCurrentTopicComponentStatus';
import { OLD_COURSE_ID, PUBLISHED, topicTypes } from '../../../constants';
import addUserCurrentTopicComponentStatusForNewCourse from './addUserCurrentTopicComponentStatusForNewCourse';
import { log } from '../../../utils';
import callLocalGraphqlApi from '../../api/callLocalGraphqlApi';

const {
  message, practiceQuestion, comicStrip, quiz, learningSlide,
} = topicTypes;

const getTopicDetailsForCourse = async (courseId, oldCourse = false) => {
  const query = `
query{
    topics(filter:{
      and:[
        {courses_some:{id: "${courseId}"}}
        {order_gte:1}
        {status: ${PUBLISHED}}
      ]
    }, orderBy: order_ASC, first: 1){
      id
      order
      ${!oldCourse ? `learningObjectives(
        filter:{
          and:[
            {
              status: ${PUBLISHED}
            }
          ]
        }
        orderBy:order_ASC
        first: 1
      ){
        id
      }` : ''}
      ${oldCourse ? `topicComponentRule{
        componentName
        order
        learningObjectiveComponentsRule {
          componentName
          order
        }
        learningObjective{
          id
          messagesMeta{
            count
          }
          questionBankMeta(filter:{and:[{assessmentType:practiceQuestion}{status:${PUBLISHED}}]}){
            count
          }
          comicStripsMeta(filter:{status:${PUBLISHED}}){
            count
          }
          learningSlidesMeta(filter:{status:${PUBLISHED}}){
            count
          }
        }
        blockBasedProject{
          id
        }
        video{
          id
        }
      }` : ''}
    }
  }
`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.topics', []);
};

const addUserCurrentTopicComponentStatusOperation = async (courseId, clientId) => {
  log(`adding currentTopicComponent for user ${clientId} with course ${courseId}`);
  if (courseId === OLD_COURSE_ID) {
    const topicDetail = await getTopicDetailsForCourse(courseId, false);
    const firstTopicId = get(topicDetail, '[0].id');
    const firstLearningObjectiveId = get(topicDetail, '[0].learningObjectives[0].id');
    addUserCurrentTopicComponentStatus(clientId, firstTopicId, firstLearningObjectiveId);
  } else {
    const topicDetail = await getTopicDetailsForCourse(courseId, true);
    const firstTopicId = get(topicDetail, '[0].id');
    const topicComponentRules = get(topicDetail, '[0].topicComponentRule', []);
    const sortedtopicComponentRules = topicComponentRules.sort((firstItem, secondItem) => firstItem.order - secondItem.order);
    const currentTopicComponent = sortedtopicComponentRules && sortedtopicComponentRules.length && sortedtopicComponentRules[0];
    let currentTopicComponentType = null;
    let learningObjectiveId = '';
    let videoId = '';
    let blockBasedPracticeId = '';
    if (currentTopicComponent.componentName) {
      if (currentTopicComponent.componentName === 'learningObjective') {
        const messageCount = get(currentTopicComponent, 'learningObjective.messagesMeta.count', 0);
        const pqCount = get(currentTopicComponent, 'learningObjective.questionBankMeta.count', 0);
        const comicStripCount = get(currentTopicComponent, 'learningObjective.comicStripsMeta.count', 0);
        const learningSlidesCount = get(currentTopicComponent, 'learningObjective.learningSlidesMeta.count', 0);
        const learningObjectiveComponentsRule = (get(currentTopicComponent, 'learningObjectiveComponentsRule', []) || [])
          .sort((firstItem, secondItem) => firstItem.order - secondItem.order);
        if (learningObjectiveComponentsRule.length) {
          currentTopicComponentType = get(learningObjectiveComponentsRule, '[0].componentName');
        } else if (messageCount) {
          currentTopicComponentType = message;
        } else if (pqCount) {
          currentTopicComponentType = practiceQuestion;
        } else if (comicStripCount) {
          currentTopicComponentType = comicStrip;
        } else if (learningSlidesCount) {
          currentTopicComponentType = learningSlide;
        }
      } else if ((currentTopicComponent.componentName === 'assignment') || (currentTopicComponent.componentName === 'homeworkAssignment') || (currentTopicComponent.componentName === 'homeworkPractice')) {
        currentTopicComponentType = quiz;
      } else {
        currentTopicComponentType = currentTopicComponent.componentName;
      }
    }
    if (currentTopicComponent.learningObjective && currentTopicComponent.learningObjective.id) {
      learningObjectiveId = currentTopicComponent.learningObjective.id;
    }

    if (currentTopicComponent.video && currentTopicComponent.video.id) {
      videoId = currentTopicComponent.video.id;
    }

    if (currentTopicComponent.blockBasedProject && currentTopicComponent.blockBasedProject.id) {
      blockBasedPracticeId = currentTopicComponent.blockBasedProject.id;
    }
    addUserCurrentTopicComponentStatusForNewCourse(clientId, courseId, firstTopicId, learningObjectiveId, videoId, blockBasedPracticeId, currentTopicComponentType);
  }
};

export default addUserCurrentTopicComponentStatusOperation;

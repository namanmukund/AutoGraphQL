import { PUBLISHED } from '../../../constants';
import callLocalGraphqlApi from '../../api/callLocalGraphqlApi';

// query to get first published topic and components corresponding to it
const topicQuery = (courseId) => `
  query{
    topics(
      filter:{
        and:[
          {
            status: ${PUBLISHED}
          }
          {
            courses_some:{
              id: "${courseId}"
            }
          }
        ]
      },
      orderBy:order_ASC
      first: 1
    ){
      id
      order
      topicComponentRule{
        componentName
        order
        childComponentName
        learningObjectiveComponentsRule {
          componentName
          order
        }
        learningObjective{
          id
          order
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
          order
        }
        video{
          id
        }
      }
    }
  }
  `;

/*
Getting all the components corresponding to that topic
This will get populated in addUserCurrentTopicComponentStatusMutation
*/
const getFirstTopicAndLearningObjective = async (courseId) => callLocalGraphqlApi(topicQuery(courseId));

export default getFirstTopicAndLearningObjective;

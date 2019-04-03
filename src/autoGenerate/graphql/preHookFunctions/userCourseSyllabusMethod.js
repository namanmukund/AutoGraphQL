import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  componentTypes,
  enrollmentTypes,
  GLOBAL_COURSE_ID,
  PUBLISHED,
} from '../../../../constants';
import { ifAuthorized } from '../../../../utils';

const userCourseSyllabusMethod = async (context) => {
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
  // condition is already present in pre hook of addUserCurrentComponentStatus
  // to check if course and user combination already exits
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
};

export default userCourseSyllabusMethod;

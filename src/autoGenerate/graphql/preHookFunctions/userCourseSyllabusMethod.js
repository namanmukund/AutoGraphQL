import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  topicTypes,
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
  // condition is already present in pre hook of addUserCurrentTopicComponentStatus
  // checking if course and user combination already exits
  const userCurrentTopicComponentStatusesQuery = `
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
      }
    }
    `;

  const userCurrentTopicComponentStatusesRes =
    await callGraphqlApi(userCurrentTopicComponentStatusesQuery);
  // Ideally each user will have 1 document in the collection. Fetching the same document
  const currentTopicComponentInfo = get(userCurrentTopicComponentStatusesRes,
    'data.userCurrentTopicComponentStatuses[0]');

  if (!currentTopicComponentInfo) {
    // mutation to create current component status of user
    const mutation = `
      mutation{
        addUserCurrentTopicComponentStatus(
          input: {
            enrollmentType: ${enrollmentTypes.free}
            currentTopicComponentType: ${topicTypes.video}
          }
          userConnectId:"${userId}"
          currentCourseConnectId:"${GLOBAL_COURSE_ID}"
          currentTopicConnectId:"${firstTopicId}"
        ){
          id
          currentCourse{
            title
            totalChapters{
              count
            }
            chapters{
              totalTopics{
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
          currentTopicComponentType
        }
      }
    `;
    await callGraphqlApi(mutation);
  }
};

export default userCourseSyllabusMethod;

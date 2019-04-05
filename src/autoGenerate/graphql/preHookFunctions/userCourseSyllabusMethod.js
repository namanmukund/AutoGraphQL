import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  topicTypes,
  enrollmentTypes,
  GLOBAL_COURSE_ID,
  PUBLISHED,
} from '../../../../constants';
import { ifAuthorized } from '../../../../utils';

// query to get topic with order=1
const topicQuery = async order => `
  query{
    topics(filter:{
      and:[
        {order:${order}},
        {status: ${PUBLISHED} }
      ]
    }){
      id
    }
  }
  `;

// query to get current component status of user
const userCurrentTopicComponentStatusesQuery = async userId => `
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

// mutation to add userCurrentTopicComponentStatus
const addUserCurrentTopicComponentStatusMutation = async (userId, firstTopicId) => `
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
    }
  }
`;

// mutation to return user couse syllabus based on user current topic component status
// also adding userCurrentTopicComponentStatus if not already present
const userCourseSyllabusMethod = async (context) => {
  const topic = await callGraphqlApi(await topicQuery(1));
  const firstTopicId = get(topic, 'data.topics[0].id');
  const authentication = ifAuthorized(context);
  const decodedUser = authentication && authentication.user;
  const { id: userId } = decodedUser;
  // condition is already present in pre hook of addUserCurrentTopicComponentStatus
  // checking if course and user combination already exits
  const userCurrentTopicComponentStatusesRes =
    await callGraphqlApi(await userCurrentTopicComponentStatusesQuery(userId));
  // Ideally each user will have 1 document in the collection. Fetching the same document
  const currentTopicComponentInfo = get(userCurrentTopicComponentStatusesRes,
    'data.userCurrentTopicComponentStatuses[0]');

  if (!currentTopicComponentInfo) {
    // mutation to create current component status of user
    await callGraphqlApi(
      await addUserCurrentTopicComponentStatusMutation(userId, firstTopicId));
  }
};

export default userCourseSyllabusMethod;

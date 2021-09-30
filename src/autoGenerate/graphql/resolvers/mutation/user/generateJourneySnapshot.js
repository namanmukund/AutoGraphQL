import { get } from 'lodash';
import validateAuthentication from '../../../../../../utils/validateAuthentication';

// query to fetch user course completion document on basis of id
const fetchUserCourseCompletion = (uccId) => `
  query{
    userCourseCompletion(id: "${uccId}"){
      id
      journeySnapshot{
        id
        name
        uri
        signedUri
      }
    }
  }
  `;

// query to fetch user approved codes and reaction counts to determine shorter/longer template to choose
const fetchUserApprovedCodes = (userId) => `
  query{
    userApprovedCodes(filter: {
      user_some:{id: "${userId}"}
    }){
      id
      totalReactionCount
    }
  }
  `;


const generateJourneySnapshotMutationResolver = async (
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  context,
) => {
  validateAuthentication(context);
  const { input } = params;
  const userCourseCompletionId = get(input, 'userCourseCompletionId', '');
  const userId = get(input, 'userId', '');
  console.log('userCourseCompletionId', userCourseCompletionId);
  const fetchUserCourseCompletionRes = await callLocalGraphqlApi(fetchUserCourseCompletion(userCourseCompletionId));
  // TODO : check whether there exists already a saved image of journey snapshot in user course completion
  const journeySnapshotFile = get(fetchUserCourseCompletionRes, 'data.userCourseCompletion.journeySnapshot', {});
  if (journeySnapshotFile) {
    // TODO : if yes then return that image url
    return get(journeySnapshotFile, 'uri', '');
  }
  // TODO : if no then proceed..
  // TODO : to generate the image, first use 'pdf-lib' to insert the dynamic elements into the pdf and then save it as an image.
  // TODO : check if the user has more than 0 codes published
  const fetchUserApprovedCodesRes = await callLocalGraphqlApi(fetchUserApprovedCodes(userId));
  let useLongerTemplate = false;
  const userApprovedCodes = get(fetchUserApprovedCodesRes, 'data.userApprovedCodes', []);
  if (userApprovedCodes && userApprovedCodes.length > 0) {
    // TODO : user the longer template else use the smaller template
    useLongerTemplate = true;
  }

  return '/sample/uri';
};

export default generateJourneySnapshotMutationResolver;

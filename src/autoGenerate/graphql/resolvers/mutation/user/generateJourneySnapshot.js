import { get } from 'lodash';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import generateJourneySnapshotUtil from './utils/generateJourneySnapshotUtil';

// query to fetch user course completion document on basis of id
const fetchUserCourseCompletion = (uccId) => `
  query{
    userCourseCompletion(id: "${uccId}"){
      id
      user {
        name
      }
      course {
        title
      }
      courseEndingDate
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
  console.log('userId', userId);
  const fetchUserCourseCompletionRes = await callLocalGraphqlApi(fetchUserCourseCompletion(userCourseCompletionId));
  console.log('fetchUserCourseCompletionRes', fetchUserCourseCompletionRes);

  // check whether there exists already a saved image of journey snapshot in user course completion
  const userCourseCompletion = get(fetchUserCourseCompletionRes, 'data.userCourseCompletion', {});
  const journeySnapshotFile = get(userCourseCompletion, 'journeySnapshot', {});
  console.log('journeySnapshotFile', journeySnapshotFile);
  if (journeySnapshotFile) {
    return get(journeySnapshotFile, 'uri', '');
  }

  // to generate the image, first use 'pdf-lib' to insert the dynamic elements into the pdf and then save it as an image.

  // check if the user has more than 0 codes published
  const fetchUserApprovedCodesRes = await callLocalGraphqlApi(fetchUserApprovedCodes(userId));
  let useLongerTemplate = false;
  const userApprovedCodes = get(fetchUserApprovedCodesRes, 'data.userApprovedCodes', []);
  if (userApprovedCodes && userApprovedCodes.length > 0) {
    useLongerTemplate = true;
  }
  console.log('userLongerTemplate', useLongerTemplate);
  // based on choice, fetch template from AWS and then proceed to construct the pdf
  const templateToFetch = useLongerTemplate ? 'JourneySnapshot-1' : 'JourneySnapshot-2';
  const url = await generateJourneySnapshotUtil(templateToFetch, userCourseCompletion);
  console.log('url', url);
  return {
    url
  };
};

export default generateJourneySnapshotMutationResolver;

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
  return '/sample/uri';
};

export default generateJourneySnapshotMutationResolver;

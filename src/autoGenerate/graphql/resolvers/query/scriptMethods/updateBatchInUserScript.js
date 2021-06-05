import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const fetchBatchesWithMentorProfiles = async () => {
  const query = `
          {
            batches(filter: {allottedMentor_exists: true},
            first:1000
            ){
              id
              code
              allottedMentor{
                id
                username
              }
            }
          }
          `;
  const batches = await callLocalGraphqlApi(query);
  return get(batches, 'data.batches', []);
};

const updateBatchInUser = async (userId, batchId) => {
  const mutation = `
      mutation{
          updateUser(id:"${userId}", mentorBatchesConnectIds:["${batchId}"], input:{}){
            id
          }
        }
      `;
  const result = await callLocalGraphqlApi(mutation);
  return get(result, 'data.updateMentorProfile', {});
};

const updateBatchInUserScript = async () => {
  // fetch from batches, which mentorProfile it belongs to and then update all of those mentor profile with given batchIds.
  // from batch.allottedMentor.user.mentorProfile.id
  let batchesLength = 0;
  let batches = [];
  do {
    // eslint-disable-next-line no-await-in-loop
    batches = await fetchBatchesWithMentorProfiles();
    batchesLength = batches.length;
    // eslint-disable-next-line no-restricted-syntax
    for (const batch of batches) {
      const batchId = batch.id;
      const userId = get(batch, 'allottedMentor.id', '');
      const username = get(batch, 'allottedMentor.username');
      const batchCode = get(batch, 'code');
      if (batchId.length > 0 && userId.length > 0) {
        // eslint-disable-next-line no-await-in-loop
        await updateBatchInUser(userId, batchId);
        // eslint-disable-next-line no-console
        console.log(`>>>>> Updated MentorProfile : ${username}, with batch : ${batchCode}`);
      }
    }
  } while (batchesLength === 1000);
};
export default updateBatchInUserScript;

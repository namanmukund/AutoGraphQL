import { get, update } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const fetchBatchesWithMentorProfiles = async () => {
  const query = `
          {
            batches(filter: {allottedMentor_some:{
              mentorProfile_exists: true
            }},
            first:1000
            ){
              id
              code
              allottedMentor{
                mentorProfile{
                  id
                  user{
                    username
                  }
                }
              }
            }
          }
          `;
  const batches = await callLocalGraphqlApi(query);
  return get(batches, 'data.batches', []);
};

const updateBatchInMentorProfile = async (mentorProfileId, batchId) => {
  const mutation = `
      mutation{
        updateMentorProfile(id:"${mentorProfileId}", batchesConnectIds:["${batchId}"]){
          id
        }
      }
      `;
  const result = await callLocalGraphqlApi(mutation);
  return get(result, 'data.updateMentorProfile', {});
};

const updateBatchInMentorProfileScript = async () => {
  // fetch from batches, which mentorProfile it belongs to and then update all of those mentor profile with given batchIds.
  // from batch.allottedMentor.user.mentorProfile.id
  let batchesLength = 0;
  let batches = [];
  do {
    batches = await fetchBatchesWithMentorProfiles();
    batchesLength = batches.length;
    for (const batch of batches) {
      const batchId = batch.id;
      const mentorProfileId = get(batch, 'allottedMentor.mentorProfile.id', '');
      const username = get(batch, 'allottedMentor.mentorProfile.user.username');
      const batchCode = get(batch, 'code');
      if (batchId.length > 0 && mentorProfileId.length > 0) {
        await updateBatchInMentorProfile(mentorProfileId, batchId);
        console.log(`>>>>> Updated MentorProfile : ${username}, with batch : ${batchCode}`);
      }
    }
  } while (batchesLength === 1000);

};
export default updateBatchInMentorProfileScript;

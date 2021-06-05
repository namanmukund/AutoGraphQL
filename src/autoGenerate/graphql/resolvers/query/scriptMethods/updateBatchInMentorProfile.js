import { get } from 'lodash';
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
              allottedMentor{
                mentorProfile{
                  id
                }
              }
            }
          }
          `;
  const batches = await callLocalGraphqlApi(query);
  return get(batches, 'data.batches', []);
};


const updateBatchInMentorProfileScript = async () => {
  // fetch from batches, which mentorProfile it belongs to and then update all of those mentor profile with given batchIds.
  // from batch.allottedMentor.user.mentorProfile.id
  const batches = await fetchBatchesWithMentorProfiles();
  const batchesLength = batches.length;

  for (const batch of batches) {
    console.log(batch);
  }


};
export default updateBatchInMentorProfileScript;

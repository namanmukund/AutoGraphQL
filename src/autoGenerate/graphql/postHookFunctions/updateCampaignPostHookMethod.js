import { get } from 'lodash';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
const fetchSchoolClass = async (schoolClassId) => {
  const query = `
          {
            schoolClass(id: "${schoolClassId}"){
              id
              grade
              section
              school{
                id
              }
            }
          }
          `;
  const schoolClass = await callLocalGraphqlApi(query);
  return get(schoolClass, 'data.schoolClass', {});
};

const fetchAllConnectedSchoolClasses = async (classesConnectIds) => {
  const classes = [];
  for (let i = 0; i < classesConnectIds.length; i += 1) {
    const data = await fetchSchoolClass(classesConnectIds[i]);
    classes.push(data);
  }
  return classes;
}


const updateCampaignPostHookMethod = async (input, params, mutationName, context) => {
  const { id: campaignId, input: campaignInput, classesConnectIds } = params;

  // now we proceed to create batches only when the combination of 
  // batchCreationBasis & classes is passed 
  const { batchRules } = campaignInput;
  if (batchRules && batchRules.batchCreationBasis.length > 0 && classesConnectIds && classesConnectIds.length > 0) {
    // fetch all the the grades and sections of the respective classes and put them in respective buckets
    const classes = await fetchAllConnectedSchoolClasses(classesConnectIds);
    console.log(classes);
    // here sort the classes based on the batchCreationBasis rules 

    // then  call async method which will create the batches..
  }

};

export default updateCampaignPostHookMethod;

import { get } from 'lodash';
import { LeadPartnerWithSimilarTitleAndAgentAlreadyExist } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const leadPartners = (title, agentId) => `
query{
  leadPartners(filter: {
    and: [
      {title: "${title}"}
      { agent_some: { id: "${agentId}" } }
    ]
  }){
    id
    title
  }
}
`;

const addLeadPartnerValidation = async (input, mutationOrQueryName, context, params) => {
  const { input: { title }, agentConnectId } = params;
  //   to check if the lead partner exist with similar title
  if (title && agentConnectId) {
    const leadPartnerData = get(await callLocalGraphqlApi(leadPartners(title, agentConnectId)), 'data.leadPartners', []);
    if (leadPartnerData && leadPartnerData.length > 0) {
      throw new LeadPartnerWithSimilarTitleAndAgentAlreadyExist();
    }
  }
  return true;
};

export default addLeadPartnerValidation;

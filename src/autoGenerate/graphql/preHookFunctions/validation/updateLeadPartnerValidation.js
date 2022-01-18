import { get } from 'lodash';
import { LeadPartnerWithSimilarTitleAlreadyExist } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const leadPartners = (title, leadPartnerId) => `
query{
  leadPartners(filter: {
    and: [
      {title: "${title}"}
      { id_not:"${leadPartnerId}" }
    ]
  }){
    id
    title
  }
}
`;

const updateLeadPartnerValidation = async (input, mutationOrQueryName, context, params) => {
  const { input: { title }, id: leadPartnerId } = params;
  //   to check if the lead partner exist with similar title
  if (title) {
    const leadPartnerData = get(await callLocalGraphqlApi(leadPartners(title, leadPartnerId)), 'data.leadPartners', []);
    if (leadPartnerData && leadPartnerData.length > 0) {
      throw new LeadPartnerWithSimilarTitleAlreadyExist();
    }
  }
  return true;
};

export default updateLeadPartnerValidation;

import { get } from 'lodash';
import { LeadPartnerWithSimilarTitleAlreadyExist } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const leadPartners = (title) => `
query{
  leadPartners(filter: {
    and: [
      {title: "${title}"}
    ]
  }){
    id
    title
  }
}
`;

const addLeadPartnerValidation = async (input, mutationOrQueryName, context, params) => {
  const { input: { title } } = params;
  //   to check if the lead partner exist with similar title
  if (title) {
    const leadPartnerData = get(await callLocalGraphqlApi(leadPartners(title)), 'data.leadPartners', []);
    if (leadPartnerData && leadPartnerData.length > 0) {
      throw new LeadPartnerWithSimilarTitleAlreadyExist();
    }
  }
  return true;
};

export default addLeadPartnerValidation;

import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';

const getBatchDetailsFromACampaign = async (campaignId) => {
  const query = `
        query{
          campaign(id: "${campaignId}") {
            id
            type
            school{
              id
            }
            batchRules {
              batchCreationBasis
            }
            batches {
              id
              type
              classes {
                grade
                section
              }
            }
          }
        }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.campaign');
};

export default getBatchDetailsFromACampaign;

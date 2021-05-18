import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { MutationController } from '../../../controllers';
import generateInviteCode from '../../../../../../utils/generateInviteCode';

const updateCodeInCampaign = async () => {
  const query = `
        query{
          campaigns{
            id
          }
        }
        `;
  const res = await callLocalGraphqlApi(query);
  const campaigns = get(res, 'data.campaigns');
  // eslint-disable-next-line no-restricted-syntax
  for (const campaign of campaigns) {
    const { id } = campaign;
    const modelMutation = new MutationController('Campaign', { bypass: true });
    // eslint-disable-next-line no-await-in-loop
    await modelMutation.updateDocument(id, { code: generateInviteCode(8) });
  }
};

export default updateCodeInCampaign;

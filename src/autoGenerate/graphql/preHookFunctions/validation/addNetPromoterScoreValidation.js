import { get } from 'lodash';
import { ConnectIdRequiredError } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { SimilarDocumentAlreadyExistError } from '../../../../../constants/errors/db';

const getNetPromoterScoreByAUser = async (userId) => {
  const query = `
        query{
          netPromoterScores(filter:{
            user_some:{id:"${userId}"}
          }){
            id
          }
        }`;

  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.netPromoterScores');
};

const addNetPromoterScoreValidation = async (params) => {
  const { userConnectId } = params;
  if (!userConnectId) {
    throw new ConnectIdRequiredError();
  }
  const netPromoterScores = await getNetPromoterScoreByAUser(userConnectId);
  if (netPromoterScores && netPromoterScores.length) {
    throw new SimilarDocumentAlreadyExistError();
  }
};

export default addNetPromoterScoreValidation;

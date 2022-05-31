import { get } from 'lodash';
import { UnauthenticatedUserError } from '../../../../../../constants/errors';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import { getFieldsBeingFetched } from '../../../../utils';
import { validateIncomingFields } from '../../../../utils/getFlatArrayForFields';
import { getUserIdandAppNameAfterValidation } from '../../../preHookFunctions/validation/utils';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';

const getEventWinners = async (eventId) => {
  const query = `{
  eventWinners(filter: { event_some: { id: "${eventId}" } }) {
    prize{
      id
      title
      minRank
      maxRank
    }
    studentProfile {
      user {
        name
        profilePic {
          uri
        }
      }
    }
    image {
      uri
    }
  }
}
`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.eventWinners', []);
};

const getEventWinner = (async (root, params, context, info) => {
  // getting input from params
  if (!get(params, 'eventId')) {
    throw new MissingMandatoryInputInRequestError();
  }
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context, true);
  validateAuthentication(context, 'app');
  const { fieldNodes } = info;
  const fieldsFetched = getFieldsBeingFetched(fieldNodes);
  context.currentUser = true;
  const {
    userIdFromContext,
  } = userAndAppInfo;
  if (!userIdFromContext) {
    if (get(fieldsFetched, 'user')) {
      const isValidField = await validateIncomingFields(get(fieldsFetched, 'user'), ['profilePic', 'name', 'id', 'profilePic.uri']);
      if (isValidField) {
        throw new UnauthenticatedUserError();
      }
    }
  }
  const winners = await getEventWinners(get(params, 'eventId'));
  let winnersResponse = [];
  if (winners && winners.length) {
    winners.forEach((winner) => {
      let profilePicUrl = '';
      if (get(winner, 'image.uri')) profilePicUrl = get(winner, 'image.uri');
      else profilePicUrl = get(winner, 'studentProfile.user.profilePic.uri');
      const { minRank } = get(winner, 'prize');
      let prizeCount = minRank;
      const prizeId = get(winner, 'prize.id');
      const prizeAddedArr = winnersResponse.filter((res) => get(res, 'prizeId') === prizeId);
      if (prizeAddedArr.length) {
        const lastPrizeCount = get(prizeAddedArr.pop(), 'prizeCount');
        prizeCount = lastPrizeCount + 1;
      }
      winnersResponse.push({
        userName: get(winner, 'studentProfile.user.name'),
        profilePicUrl,
        prizeTitle: get(winner, 'prize.title'),
        prizeCount,
        prizeId: get(winner, 'prize.id'),
      });
    });
    winnersResponse = winnersResponse.map(({
      userName, profilePicUrl, prizeTitle, prizeCount,
    }) => ({
      userName,
      profilePicUrl,
      prizeTitle,
      prizeCount,
    }));
  }
  return winnersResponse;
});

export default getEventWinner;

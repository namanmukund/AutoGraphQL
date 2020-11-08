import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import availableSlotsQuery from '../../graphqlQueries/availableSlotsQuery';
import updateAvailableSlotQuery from '../../graphqlQueries/updateAvailableSlotQuery';
import { byPassMenteeValidationApps } from '../../../../../constants';

// update if doc exist else leave
const reduceParticularAvailableSlotOfADate = async (slotTimeStringArray, date, context, availableSlots) => {
  const { isTrialSession, userCountryCode, appName } = context;
  if (typeof isTrialSession === 'boolean' && !isTrialSession) {
    return true;
  }

  // temporary code to allow users to book multiple slots at a time for outside India
  // we would have to eventually change it on role=school etc.
  if (userCountryCode && userCountryCode !== '+91') {
    return true;
  }

  // by pass validation if call is from backend
  if (byPassMenteeValidationApps.includes(appName)) {
    return true;
  }

  if (!availableSlots || !availableSlots.length) {
    const availableSlotsRes = await callLocalGraphqlApi(availableSlotsQuery(date));
    // eslint-disable-next-line no-param-reassign
    availableSlots = get(availableSlotsRes, 'data.availableSlots');
  }
  // update if doc exist else leave
  if (availableSlots && availableSlots.length) {
    const docToBeUpdated = {};

    slotTimeStringArray.forEach((slot) => {
      if (availableSlots[0][slot] > 0) {
        docToBeUpdated[slot] = availableSlots[0][slot] - 1;
      }
    });

    const { id: availableSlotId } = availableSlots[0];
    const variables = {
      input: docToBeUpdated,
    };
    await callLocalGraphqlApi(updateAvailableSlotQuery(availableSlotId), context, variables);
  }
  return true;
};

export default reduceParticularAvailableSlotOfADate;

import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';
import getSelectedSlotsTime from './utils/getSelectedSlotsTime';
import { PastDateOrSlotError } from '../../../../../constants/errors/db';
import batchSessionQuery from '../../graphqlQueries/batchSessionQuery';

const deleteBatchSessionValidation = async (params) => {
  const { id: batchSessionId } = params;
  const batchSessionData = await callLocalGraphqlApi(batchSessionQuery(batchSessionId));
  const batchSession = get(batchSessionData, 'data.batchSession');

  if (!batchSession || !batchSession.id) {
    throw new DatabaseRecordNotFoundError();
  }

  const { bookingDate, ...slots } = batchSession;
  const slotTimeArray = getSelectedSlotsTime(slots);
  // of any slots is taken or the date is of past then the doc can not be deleted
  if (slotTimeArray && slotTimeArray.length) {
    const date = new Date(bookingDate);
    const dateTime = date.setHours(
      date.getHours() + slotTimeArray[0],
    );
    const currentDate = new Date();
    if (dateTime <= currentDate) {
      throw new PastDateOrSlotError();
    }
  }
};

export default deleteBatchSessionValidation;

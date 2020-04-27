import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import mentorSessionQuery from '../../graphqlQueries/mentorSessionQuery';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';
import getSelectedSlotsTime from './utils/getSelectedSlotsTime';
import { InvalidSessionDateTimeError } from '../../../../../constants/errors/input';

const deleteMentorSessionValidation = async (params, mutationOrQueryName, context) => {
  const { id: mentorSessionId } = params;
  const mentorSessionData = await callLocalGraphqlApi(mentorSessionQuery(mentorSessionId));
  const mentorSession = get(mentorSessionData, 'data.mentorSession');
  if (!mentorSession || !mentorSession.id) {
    throw new DatabaseRecordNotFoundError();
  }
  const { availabilityDate, ...slots } = mentorSession;
  const slotTimeArray = getSelectedSlotsTime(slots);
  // of any slots is taken or the date is of past then the doc can not be deleted
  if (slotTimeArray && slotTimeArray.length) {
    const date = new Date(availabilityDate);
    const dateTime = date.setHours(
      date.getHours() + slotTimeArray[slotTimeArray.length - 1],
    );
    const currentDate = new Date();
    if (dateTime <= currentDate) {
      throw new InvalidSessionDateTimeError();
    }
  }

  // eslint-disable-next-line no-param-reassign
  context.previousDocument = mentorSession;
};


export default deleteMentorSessionValidation;

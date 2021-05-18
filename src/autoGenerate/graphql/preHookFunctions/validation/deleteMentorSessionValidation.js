import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import mentorSessionQuery from '../../graphqlQueries/mentorSessionQuery';
import { DatabaseRecordNotFoundError, SlotsOccupiedError } from '../../../../../constants/errors';
import getSelectedSlotsTime from './utils/getSelectedSlotsTime';
import { PastDateOrSlotError } from '../../../../../constants/errors/db';
import getUserIdandAppNameAfterValidation from './utils/getUserIdandAppNameAfterValidation';
import { sessionType } from '../../../../../constants';

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
      throw new PastDateOrSlotError();
    }
  }
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context);

  const {
    appName,
  } = userAndAppInfo;
  context.appName = appName;

  // eslint-disable-next-line no-param-reassign
  context.previousDocument = mentorSession;

  // if batchSession exists for type batch, mentor session can't be deleted
  // if MMS exists for type paid/trial, mentor session can't be deleted
  if (mentorSession.sessionType === sessionType.batch && batchSessions.length) {
    throw new SlotsOccupiedError({
      data: {
        message: 'Session exists for at least one of the slots in mentorSession',
      },
    });
    // for trial/paid mentorSession we will check mentorMenteeSessions and see which slots are occupied
  } else if (mentorMenteeSessions.length) {
    throw new SlotsOccupiedError({
      data: {
        message: 'Session exists for at least one of the slots in mentorSession',
      },
    });
  }
};

export default deleteMentorSessionValidation;

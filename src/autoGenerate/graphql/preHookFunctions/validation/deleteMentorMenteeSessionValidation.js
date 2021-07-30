import { get } from 'lodash';
import validateTokenAndExtractInformation from './utils/validateTokenAndExtractInformation';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';
import { CanNotDeleteCompletedSessionError } from '../../../../../constants/errors/input';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import getSlotTimesInString from '../../../../../utils/getSlotTimesInString';

const getMentorMenteeSessionData = async (id) => {
  const query = `
    query{
      mentorMenteeSession(id:"${id}"){
        id
        sessionStatus
        hasRescheduled
        rescheduledDate
        rescheduledDateProvided
        isFeedbackSubmitted
        sessionNotConducted
        sessionCommentByMentor
        didNotTurnUpInSession
        didNotPickTheCall
        internetIssue
        zoomIssue
        laptopIssue
        chromeIssue
        powerCut
        notResponseAndDidNotTurnUp
        turnedUpButLeftAbruptly
        classDurationExceeded
        webSiteLoadingIssue
        videoNotLoading
        codePlaygroundIssue
        logInOTPError
        otherReasonForChallenges
        otherTechnicalReason
        languageBarrier
        otherLanguageBarrier
        sessionStartDate
        menteeSession {
          id
        }
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.mentorMenteeSession');
};

const menteeSessionQuery = (menteeSessionId) => `{
  menteeSession(id: "${menteeSessionId}") {
    id
    bookingDate
    ${getSlotTimesInString()}
    topic {
      id
      order
    }
    user {
      id
      name
      country
      studentProfile {
        parents {
          user {
            id
            name
            email
            phone {
              number
              countryCode
            }
          }
        }
      }
    }
  }
}`;

const deleteMentorMenteeSessionValidation = async (newParams, mutationOrQueryName, context) => {
  const { id, mentorSessionConnectId } = newParams;

  const mentorMenteeSessionDoc = await getMentorMenteeSessionData(id);
  const menteeSessionDoc = await callLocalGraphqlApi(menteeSessionQuery(get(mentorMenteeSessionDoc, 'menteeSession.id')));
  context.menteeSession = menteeSessionDoc;
  context.prevMenteeSessionDoc = context.previousDocument;
  if (!(mentorMenteeSessionDoc && mentorMenteeSessionDoc.id)) {
    throw new DatabaseRecordNotFoundError();
  }
  const { sessionStatus: prevSessionStatus } = mentorMenteeSessionDoc;
  // if session is complete and user is trying to delete, then throw error
  if (prevSessionStatus === 'completed') {
    throw new CanNotDeleteCompletedSessionError();
  }
  // getting current user from context to send in logs
  const userInfo = validateTokenAndExtractInformation(context, false);
  const {
    currentUser,
    currentApp,
  } = userInfo;
  log('PRE CURRENT APP-------->', currentApp);

  // eslint-disable-next-line no-param-reassign
  context.currentUser = currentUser;
  context.currentAppName = get(currentApp, 'name');
  log('PRE CURRENT APPNAME-------->', context.currentAppName);
  context.mentorSessionConnectId = mentorSessionConnectId;
  context.prevMentorMenteeSessionDoc = mentorMenteeSessionDoc;
};

export default deleteMentorMenteeSessionValidation;

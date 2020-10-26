import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { MutationController } from '../../../controllers';

const updateMentorMenteeSession = async (id, modifiedData) => {
  const modelMutations = new MutationController('MentorMenteeSession', { bypass: true });
  console.log('......data to update', modifiedData);
  const data = await modelMutations.updateOne({ id }, modifiedData);
  console.log('updated...', data);
  return data;
};

const getMentorMenteeSalesOperation = async () => {
  const query = `
query{
  mentorMenteeSessions(filter:{
    topic_some:{order:1}
  }){
    id
    sessionStatus
    salesOperation{
      id
      hasRescheduled
      rescheduledDate
      rescheduledDateProvided
      internetIssue
      zoomIssue
      laptopIssue
      chromeIssue
      powerCut
      notResponseAndDidNotTurnUp
      turnedUpButLeftAbruptly
      leadNotVerifiedProperly
      otherReasonForReschedule
      salesOperationLog(filter:{topic_some:{order:1}}){
        id
        log
      }
    }
  }
}
`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.mentorMenteeSessions');
};

const migrateRescheduledReasonsToMentorMenteeSession = async () => {
  const mentorMenteeSalesOperations = await getMentorMenteeSalesOperation();
  // eslint-disable-next-line no-restricted-syntax
  for (const mentorMenteeSalesOperation of mentorMenteeSalesOperations) {
    const { id: mentorMenteeSessionId, salesOperation } = mentorMenteeSalesOperation;
    if (salesOperation && salesOperation.id) {
      const {
        id: salesOperationId, salesOperationLog, ...rescheduledData
      } = salesOperation;
      Object.keys(rescheduledData).forEach((key) => (rescheduledData[key] == null) && delete rescheduledData[key]);
      if (salesOperationLog && salesOperationLog.length) {
        rescheduledData.sessionCommentByMentor = get(JSON.parse(salesOperationLog[0].log), 'blocks[0].text');
      }
      if (Object.keys(rescheduledData).length) {
        // eslint-disable-next-line no-await-in-loop
        await updateMentorMenteeSession(mentorMenteeSessionId, rescheduledData);
      }
    }
  }
};

export default migrateRescheduledReasonsToMentorMenteeSession;

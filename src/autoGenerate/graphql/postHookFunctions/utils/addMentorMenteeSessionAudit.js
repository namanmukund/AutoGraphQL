import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const mentorMenteeSessionAuditQuery = (mentorMenteeSessionId) => `
  query{
  mentorMenteeSessionAudits(filter:{
    mentorMenteeSession_some:{
      id: "${mentorMenteeSessionId}"
    }
  }){
    id
  }
}
`;

// mutation to add mentorMenteeSessionAudit
const addMentorMenteeSessionAuditQuery = (
  mentorMenteeSessionId,
) => `
  mutation{
  addMentorMenteeSessionAudit(mentorMenteeSessionConnectId: "${mentorMenteeSessionId}", ,input:{}){
    id
  }
}
  `;

const addMentorMenteeSessionAudit = async (
  mentorMenteeSessionId,
) => {
  const mentorMenteeSessionAuditInfo = await callLocalGraphqlApi(mentorMenteeSessionAuditQuery(mentorMenteeSessionId));
  const mentorMenteeSessionAuditId = get(mentorMenteeSessionAuditInfo, 'data.mentorMenteeSessionAudits[0].id', false);

  if (!mentorMenteeSessionAuditId) {
    callLocalGraphqlApi(addMentorMenteeSessionAuditQuery(
      mentorMenteeSessionId,
    ));
  }
};

export default addMentorMenteeSessionAudit;

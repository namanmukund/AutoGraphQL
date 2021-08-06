import { get } from 'lodash';
import { auditType } from '../../../../../constants';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { fetchAllAuditQuestion } from './addSalesAudit';

const { mentor } = auditType;

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
  auditQuestionsIds,
) => `
  mutation{
  addMentorMenteeSessionAudit(mentorMenteeSessionConnectId: "${mentorMenteeSessionId}",
  input: {
      auditQuestions: [
        ${auditQuestionsIds}
      ]
    }){
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
    const auditQuestions = await fetchAllAuditQuestion(mentor);
    let auditQuestionsIds = '';
    if (auditQuestions && auditQuestions.length > 0) {
      auditQuestions.forEach((auditQuestion) => {
        auditQuestionsIds += `{ auditQuestionConnectId: "${get(auditQuestion, 'id')}" }`;
      });
    }
    callLocalGraphqlApi(addMentorMenteeSessionAuditQuery(
      mentorMenteeSessionId,
      auditQuestionsIds,
    ));
  }
};

export default addMentorMenteeSessionAudit;

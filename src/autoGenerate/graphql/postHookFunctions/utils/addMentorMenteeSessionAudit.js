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
  questionSectionsQuery,
) => `
  mutation{
  addMentorMenteeSessionAudit(mentorMenteeSessionConnectId: "${mentorMenteeSessionId}",
  input: {
      auditQuestions: [
        ${auditQuestionsIds}
      ]
      customSectionScore: [${questionSectionsQuery}]
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
    let sectionsArray = [];
    if (auditQuestions && auditQuestions.length > 0) {
      auditQuestions.forEach((auditQuestion) => {
        auditQuestionsIds += `{ auditQuestionConnectId: "${get(auditQuestion, 'id')}" }`;
        if (get(auditQuestion, 'section')) {
          sectionsArray.push(get(auditQuestion, 'section'));
        }
      });
    }
    sectionsArray = [...new Set(sectionsArray)];
    let questionSectionsQuery = '';
    sectionsArray.forEach((section) => {
      questionSectionsQuery += `{questionSection: ${section}}`;
    });
    callLocalGraphqlApi(addMentorMenteeSessionAuditQuery(
      mentorMenteeSessionId,
      auditQuestionsIds,
      questionSectionsQuery,
    ));
  }
};

export default addMentorMenteeSessionAudit;

import { get } from 'lodash';
import { auditType, auditSubType } from '../../../../../constants';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { fetchAllAuditQuestion } from './addSalesAudit';

const { mentor } = auditType;

const { b2cDemo, b2cPaid } = auditSubType;

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
  totalScore,
) => `
  mutation{
  addMentorMenteeSessionAudit(mentorMenteeSessionConnectId: "${mentorMenteeSessionId}",
  input: {
      totalScore: ${totalScore}
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
  mentorMenteeSessionId, order,
) => {
  const mentorMenteeSessionAuditInfo = await callLocalGraphqlApi(mentorMenteeSessionAuditQuery(mentorMenteeSessionId));
  const mentorMenteeSessionAuditId = get(mentorMenteeSessionAuditInfo, 'data.mentorMenteeSessionAudits[0].id', false);

  if (!mentorMenteeSessionAuditId) {
    let auditFilter = '';
    if (order === 1) {
      auditFilter = `{ auditSubType: ${b2cDemo} }`;
    } else {
      auditFilter = `{ auditSubType: ${b2cPaid} }`;
    }
    const auditQuestions = await fetchAllAuditQuestion(mentor, auditFilter);
    let auditQuestionsIds = '';
    let sectionIdsArray = [];
    let totalScore = 0;
    if (auditQuestions && auditQuestions.length > 0) {
      auditQuestions.forEach((auditQuestion) => {
        auditQuestionsIds += `{ auditQuestionConnectId: "${get(auditQuestion, 'id')}" }`;
        if (get(auditQuestion, 'section.id')) {
          sectionIdsArray.push(get(auditQuestion, 'section.id'));
        }
        if (get(auditQuestion, 'score', 0)) {
          totalScore += get(auditQuestion, 'score');
        }
      });
    }
    sectionIdsArray = [...new Set(sectionIdsArray)];
    let questionSectionsQuery = '';
    sectionIdsArray.forEach((sectionId) => {
      questionSectionsQuery += `{questionSectionConnectId: "${sectionId}"}`;
    });
    callLocalGraphqlApi(addMentorMenteeSessionAuditQuery(
      mentorMenteeSessionId,
      auditQuestionsIds,
      questionSectionsQuery,
      totalScore,
    ));
  }
};

export default addMentorMenteeSessionAudit;

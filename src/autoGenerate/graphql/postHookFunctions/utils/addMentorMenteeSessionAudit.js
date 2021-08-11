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
    let sectionIdsArray = [];
    if (auditQuestions && auditQuestions.length > 0) {
      auditQuestions.forEach((auditQuestion) => {
        auditQuestionsIds += `{ auditQuestionConnectId: "${get(auditQuestion, 'id')}" }`;
        if (get(auditQuestion, 'section.id')) {
          sectionIdsArray.push(get(auditQuestion, 'section.id'));
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
    ));
  }
};

export default addMentorMenteeSessionAudit;

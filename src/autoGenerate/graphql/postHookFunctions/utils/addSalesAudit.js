import { get } from 'lodash';
import { auditType as auditTypesFilter } from '../../../../../constants';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const { preSales, postSales } = auditTypesFilter;

export const fetchAllAuditQuestion = async (auditType) => {
  const query = `
    {
      auditQuestions(filter:{ and: [ { auditType: ${auditType} } { status: published } ] }){
        id
        section{
          id
        }
        score
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.auditQuestions');
};

const addPreSalesAuditQuery = (auditQuestionsIds, clientId, questionSectionsQuery, totalScore) => `
mutation {
    addPreSalesAudit(
      clientConnectId: "${clientId}"
      input: {
        totalScore: ${totalScore}
        auditQuestions: [
          ${auditQuestionsIds}
        ]
        customSectionScore: [
          ${questionSectionsQuery}
        ]
      }
    ) {
      id
    }
}`;

const addPostSalesAuditQuery = (auditQuestionsIds, mentorMenteeSessionId, questionSectionsQuery, totalScore) => `
mutation {
  addPostSalesAudit(
    mentorMenteeSessionConnectId: "${mentorMenteeSessionId}"
    input: {
      totalScore: ${totalScore}
      auditQuestions: [
        ${auditQuestionsIds}
      ]
      customSectionScore: [
        ${questionSectionsQuery}
      ]
    }
  ) {
    id
  }
}`;

const addSalesAudit = async ({ mentorMenteeSessionId, clientId, auditType }) => {
  const auditQuestions = await fetchAllAuditQuestion(auditType);
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
  if (auditQuestionsIds) {
    if (auditType === preSales) {
      callLocalGraphqlApi(addPreSalesAuditQuery(auditQuestionsIds, clientId, questionSectionsQuery, totalScore));
    } else if (auditType === postSales) {
      callLocalGraphqlApi(addPostSalesAuditQuery(auditQuestionsIds, mentorMenteeSessionId, questionSectionsQuery, totalScore));
    }
  }
};

export default addSalesAudit;

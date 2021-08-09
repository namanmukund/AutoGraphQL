import { get } from 'lodash';
import { auditType as auditTypesFilter } from '../../../../../constants';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const { preSales, postSales } = auditTypesFilter;

export const fetchAllAuditQuestion = async (auditType) => {
  const query = `
    {
      auditQuestions(filter:{ and: [ { auditType: ${auditType} } { status: published } ] }){
        id
        section
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.auditQuestions');
};

const addPreSalesAuditQuery = (auditQuestionsIds, clientId, questionSectionsQuery) => `
mutation {
    addPreSalesAudit(
      clientConnectId: "${clientId}"
      input: {
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

const addPostSalesAuditQuery = (auditQuestionsIds, mentorMenteeSessionId, questionSectionsQuery) => `
mutation {
  addPostSalesAudit(
    mentorMenteeSessionConnectId: "${mentorMenteeSessionId}"
    input: {
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
  if (auditQuestionsIds) {
    if (auditType === preSales) {
      callLocalGraphqlApi(addPreSalesAuditQuery(auditQuestionsIds, clientId, questionSectionsQuery));
    } else if (auditType === postSales) {
      callLocalGraphqlApi(addPostSalesAuditQuery(auditQuestionsIds, mentorMenteeSessionId, questionSectionsQuery));
    }
  }
};

export default addSalesAudit;

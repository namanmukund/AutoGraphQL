import { get } from 'lodash';
import { auditType as auditTypesFilter } from '../../../../../constants';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const { preSales, postSales } = auditTypesFilter;

const fetchAllAuditQuestion = async (auditType) => {
  const query = `
    {
      auditQuestions(filter:{ and: [ { auditType: ${auditType} } { status: published } ] }){
        id
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.auditQuestions');
};

const addPreSalesAuditQuery = (auditQuestionsIds, clientId) => `
    mutation {
        addPreSalesAudit(
            clientConnectId: "${clientId}"
            input: {
            auditQuestions: [
              ${auditQuestionsIds}
            ]
            }
        ) {
          id
        }
    }`;

const addPostSalesAuditQuery = (auditQuestionsIds, mentorMenteeSessionId) => `mutation {
  addPostSalesAudit(
    mentorMenteeSessionConnectId: "${mentorMenteeSessionId}"
    input: {
      auditQuestions: [
        ${auditQuestionsIds}
      ]
    }
  ) {
    id
  }
}`;

const addSalesAudit = async ({ mentorMenteeSessionId, clientId, auditType }) => {
  const auditQuestions = await fetchAllAuditQuestion(auditType);
  let auditQuestionsIds = '';
  if (auditQuestions && auditQuestions.length > 0) {
    auditQuestions.forEach((auditQuestion) => {
      auditQuestionsIds += `{ auditQuestionConnectId: "${get(auditQuestion, 'id')}" }`;
    });
  }
  if (auditQuestionsIds) {
    if (auditType === preSales) {
      callLocalGraphqlApi(addPreSalesAuditQuery(auditQuestionsIds, clientId));
    } else if (auditType === postSales) {
      callLocalGraphqlApi(addPostSalesAuditQuery(auditQuestionsIds, mentorMenteeSessionId));
    }
  }
};

export default addSalesAudit;

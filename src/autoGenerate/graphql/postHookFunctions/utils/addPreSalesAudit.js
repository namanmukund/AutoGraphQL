import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

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

const addPreSalesAudit = async (clientId, auditType) => {
  const auditQuestions = await fetchAllAuditQuestion(auditType);
  let auditQuestionsIds = '';
  if (auditQuestions && auditQuestions.length > 0) {
    auditQuestions.forEach((auditQuestion) => {
      auditQuestionsIds += `{ auditQuestionConnectId: "${get(auditQuestion, 'id')}" }`;
    });
  }
  if (auditQuestionsIds) {
    callLocalGraphqlApi(addPreSalesAuditQuery(auditQuestionsIds, clientId));
  }
};

export default addPreSalesAudit;

import { get } from 'lodash';
import { auditType as auditTypesFilter, batchType, auditSubType } from '../../../../../constants';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const { b2b, b2b2c, normal } = batchType;

const { preSales, postSales, mentor } = auditTypesFilter;

const { b2cDemo, b2cPaid } = auditSubType;

export const fetchAllAuditQuestion = async (auditType, filterQuery) => {
  const query = `
    {
      auditQuestions(filter:{ and: [ { auditType: ${auditType} } { status: published } ${filterQuery || ''} ] }){
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

// mutation to add PreSalesAudit
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

// mutation to add PostSalesAudit
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

// mutation to add mentorMenteeSessionAudit for batchSession
const addMentorMenteeSessionAuditForBatchQuery = (
  batchSessionId,
  auditQuestionsIds,
  questionSectionsQuery,
  totalScore,
) => `
  mutation{
  addMentorMenteeSessionAudit(batchSessionConnectId: "${batchSessionId}",
  input: {
      totalScore: ${totalScore}
      auditQuestions: [
        ${auditQuestionsIds}
      ]
      isBatchAudit: true
      customSectionScore: [${questionSectionsQuery}]
    }){
    id
  }
}
  `;

const addSalesAudit = async ({
  mentorMenteeSessionId, clientId, auditType, batchSessionId, batchTypeValue, batchTopicOrder,
}) => {
  let auditQuestions = null;
  let isBatchAudit = false;
  if (auditType === mentor && batchSessionId && batchTypeValue && batchTopicOrder) {
    let filterQuery = '';
    if (batchTypeValue === b2b) {
      filterQuery = `{ auditSubType: ${b2b} }`;
    } else if ((batchTypeValue === b2b2c || batchTypeValue === normal) && batchTopicOrder === 1) {
      filterQuery = `{ auditSubType: ${b2cDemo} }`;
    } else if ((batchTypeValue === b2b2c || batchTypeValue === normal) && batchTopicOrder !== 1) {
      filterQuery = `{ auditSubType: ${b2cPaid} }`;
    }
    isBatchAudit = true;
    auditQuestions = await fetchAllAuditQuestion(auditType, filterQuery);
  } else {
    auditQuestions = await fetchAllAuditQuestion(auditType);
  }
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
    } else if (isBatchAudit) {
      callLocalGraphqlApi(addMentorMenteeSessionAuditForBatchQuery(
        batchSessionId,
        auditQuestionsIds,
        questionSectionsQuery,
        totalScore,
      ));
    }
  }
};

export default addSalesAudit;

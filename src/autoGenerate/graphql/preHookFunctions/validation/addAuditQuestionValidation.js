import { get } from 'lodash';
import { auditQuestionType, questionTypes, auditType as auditTypeValues } from '../../../../../constants';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import {
  OrderAndAuditTypeExists,
  MCQOptionNotProvided,
  MaxRatingAndDisplayTypeNotFound,
} from '../../../../../constants/errors';

const { mentor } = auditTypeValues;

const auditQuestionQuery = (order, auditType, auditSubType) => `
{
  auditQuestions(filter: {
    and: [
      {order: ${order}},
      {auditType: ${auditType}},
      ${auditSubType ? `{ auditSubType: ${auditSubType} }` : ''}
    ]
  }){
    id
  }
}
`;

// prehook logic to check audit question input is valid
/* eslint-disable no-unused-vars */
const addAuditQuestionValidation = async (params, mutationOrQueryName, context) => {
  const { input } = params;
  const {
    order,
    auditType,
    questionType,
    auditSubType,
    score,
  } = input;
  const maxRating = get(input, 'maxRating', null);
  const ratingDisplayType = get(input, 'ratingDisplayType', null);
  // check if previous question exists with the same order and auditType
  let auditQuestionQueryRes = null;
  if (auditType === mentor && auditSubType) {
    auditQuestionQueryRes = await callLocalGraphqlApi(auditQuestionQuery(order, auditType, auditSubType));
  } else {
    auditQuestionQueryRes = await callLocalGraphqlApi(auditQuestionQuery(order, auditType));
  }
  const auditQuestions = get(auditQuestionQueryRes, 'data.auditQuestions', []);
  if (auditQuestions.length > 0) {
    throw new OrderAndAuditTypeExists();
  }
  // check if atleast one MCQ is sent
  if (questionType === auditQuestionType.mcq) {
    const { mcqOptions } = input;
    if (!mcqOptions || mcqOptions.length === 0) {
      throw new MCQOptionNotProvided();
    }
  }
  // check if maxRating and ratingDisplay is passed if rating is passed
  if (questionTypes === auditQuestionType.rating && (!maxRating || !ratingDisplayType)) {
    throw new MaxRatingAndDisplayTypeNotFound();
  }
};

export default addAuditQuestionValidation;

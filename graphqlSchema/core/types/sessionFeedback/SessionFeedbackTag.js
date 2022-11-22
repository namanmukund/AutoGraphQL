import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const SessionFeedbackTag = `
  type SessionFeedbackTag @model 
  ${getPermissionSchemaString('SessionFeedbackTag')}{
    label: String!
    grades: [Grade]
    components: [TopicComponents]
    category: SessionFeedbackCategory
    rating: [Int] @length(min: 1, max: 5) @groupBy
    feedbackType: SessionFeedbackType
  }
`;

export default [SessionFeedbackTag];

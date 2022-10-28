import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const SessionFeedbackTag = `
  type SessionFeedbackTag @model 
  ${getPermissionSchemaString('SessionFeedbackTag')}{
    label: String!
    grades: [Grade]
    components: [TopicComponents]
    category: SessionFeedbackCategory
  }
`;

export default [SessionFeedbackTag];

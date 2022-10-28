const SessionFeedbackTag = `
  type SessionFeedbackTag @model {
    label: String!
    grades: [Grade]
    components: [TopicComponents]
    category: SessionFeedbackCategory
  }
`;

export default [SessionFeedbackTag];

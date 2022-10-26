import sessionFeedbackTagsConst from '../../../../../constants/sessionFeedbackTagsConst';

export const getSessionFeedbackTags = () => {
  let sessionFeedbackTags = 'enum SessionFeedbackTag {';
  sessionFeedbackTagsConst.forEach((feedbackTag) => {
    sessionFeedbackTags += `${feedbackTag.tag} `;
  });
  sessionFeedbackTags += '}';
  return sessionFeedbackTags;
};

const SessionFeedbackTag = getSessionFeedbackTags();

export default SessionFeedbackTag;

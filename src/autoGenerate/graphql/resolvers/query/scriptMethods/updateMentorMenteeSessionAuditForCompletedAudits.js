import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const fetchMentorMenteeSessionAudits = async () => {
  const query = `{
  mentorMenteeSessionAudits(filter: { status: completed }) {
    id
    updatedAt
  }
}
`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.mentorMenteeSessionAudits', []);
};

const updateMentorMenteeSessionAudit = async (id, completedDate) => {
  const updateQuery = `mutation {
  updateMentorMenteeSessionAudit(id: "${id}", input: { auditCompletedOn: "${completedDate}" }) {
    id
  }
}
`;
  const result = await callLocalGraphqlApi(updateQuery);
  return get(result, 'data.updateMentorMenteeSessionAudit');
};

const updateMentorMenteeSessionAuditForCompletedAudits = async () => {
  const mentorMenteeSessionAudits = await fetchMentorMenteeSessionAudits();
  if (mentorMenteeSessionAudits && mentorMenteeSessionAudits.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const mentorMenteeSessionAudit of mentorMenteeSessionAudits) {
      if (get(mentorMenteeSessionAudit, 'id')) {
        // eslint-disable-next-line no-await-in-loop
        await updateMentorMenteeSessionAudit(
          get(mentorMenteeSessionAudit, 'id'),
          get(mentorMenteeSessionAudit, 'updatedAt'),
        );
        // eslint-disable-next-line no-console
        console.log(`>>>>> Updated mentorMenteeSessionAudit id: ${get(mentorMenteeSessionAudit, 'id')}`);
      }
    }
  }
};

export default updateMentorMenteeSessionAuditForCompletedAudits;

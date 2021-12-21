/* eslint-disable no-await-in-loop */
import { get } from 'lodash';
import moment from 'moment';
import { log } from '../../../../../../utils';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const fetchPastLeadDetails = async () => {
  const leadStartDate = moment().subtract(3, 'months').startOf('month').toISOString();
  const query = `{
  users(
    filter: {
      and: [
        { role: mentee }
        {
          createdAt_gte: "${leadStartDate}"
        }
        { studentProfile_exists: true }
        { studentProfile_some: { bookingAgent_exists: false } }
        {
          or: [
            { utmTerm_exists: true }
            { utmSource_exists: true }
            { utmMedium_exists: true }
            { utmCampaign_exists: true }
            { utmContent_exists: true }
          ]
        }
      ]
    }
  ) {
    id
    studentProfile {
      id
    }
    name
    utmTerm
    utmSource
    utmMedium
    utmContent
    utmCampaign
  }
}`;
  const leads = await callLocalGraphqlApi(query);
  return get(leads, 'data.users', []);
};

const fetchMenteeSessions = async (userIds) => {
  const query = `{
  menteeSessions(
    filter: {
      and: [
        { user_some: { id_in: [${userIds}] } }
        { topic_some: { order: 1 } }
      ]
    }
  ) {
    id
    user{
      id
    }
  }
}
`;
  const menteeSession = await callLocalGraphqlApi(query);
  return get(menteeSession, 'data.menteeSessions', []);
};

const fetchMentorMenteeSession = async (userIds) => {
  const query = `{
  mentorMenteeSessions(
    filter: {
      and: [
        { topic_some: { order: 1 } }
        { menteeSession_some: { user_some: { id_in: [${userIds}] } } }
      ]
    }
  ) {
    id
    menteeSession {
      id
      user {
        id
      }
    }
  }
}
`;
  const mentorMenteeSessions = await callLocalGraphqlApi(query);
  return get(mentorMenteeSessions, 'data.mentorMenteeSessions', []);
};

const fetchUtmAgent = async (utmSource, utmCampaign, utmTerm, utmContent, utmMedium) => {
  const query = `{
  leadPartnerAgents(
    filter: {
      utmDetails_some: {
        and: [
          ${utmSource ? `{ source: "${utmSource}" }` : ''}
          ${utmCampaign ? `{ campaign: "${utmCampaign}" }` : ''}
          ${utmTerm ? `{ term: "${utmTerm}" }` : ''}
          ${utmContent ? `{ content: "${utmContent}" }` : ''}
          ${utmMedium ? `{ medium: "${utmMedium}" }` : ''}
        ]
      }
    }
  ) {
    id
    createdAt
    agent {
      id
      name
    }
  }
}
`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.leadPartnerAgents', []);
};

const connectBookingAgentToDoc = async (docId, agentId, type) => {
  const connectQuery = `mutation {
  ${type === 'studentProfile' ? `addToBookingAgentStudentProfile(studentProfileId: "${docId}", userId: "${agentId}") {
    studentProfile {
      id
    }
  }` : ''}
  ${type === 'menteeSession' ? `addToMenteeSessionBookingAgent(menteeSessionId: "${docId}", userId: "${agentId}") {
    menteeSession {
      id
    }
  }` : ''}
  ${type === 'mentorMenteeSession' ? `addToMentorMenteeSessionBookingAgent(mentorMenteeSessionId: "${docId}", userId: "${agentId}") {
    mentorMenteeSession {
      id
    }
  }` : ''}
}
`;
  await callLocalGraphqlApi(connectQuery);
};

const updateLeadAnalyticsForPastLeads = async () => {
  const leadsData = await fetchPastLeadDetails();
  let userIds = '';
  if (leadsData && leadsData.length > 0) {
    leadsData.forEach((user) => { userIds += `"${get(user, 'id')}"`; });
  }
  const menteeSessionData = await fetchMenteeSessions(userIds);
  const mentorMenteeSessionsData = await fetchMentorMenteeSession(userIds);
  // eslint-disable-next-line no-restricted-syntax
  for (const lead of leadsData) {
    const {
      utmTerm, utmSource, utmMedium, utmContent, utmCampaign,
    } = lead;
    // eslint-disable-next-line no-await-in-loop
    const leadPartnerDetail = await fetchUtmAgent(utmSource, utmCampaign, utmTerm, utmContent, utmMedium);
    if (leadPartnerDetail.length > 0) {
      const menteeSession = menteeSessionData.filter((mSession) => get(mSession, 'user.id') === get(lead, 'id'));
      const bookingAgentConnectId = get(leadPartnerDetail, '[0].agent.id');
      log(`updating StudentProfile ${get(lead, 'studentProfile.id')} with bookingAgent: ${bookingAgentConnectId}`);
      await connectBookingAgentToDoc(get(lead, 'studentProfile.id'), bookingAgentConnectId, 'studentProfile');
      if (menteeSession.length > 0) {
        const menteeSessionId = get(menteeSession, '[0].id');
        log(`updating menteeSessionId ${menteeSessionId} with bookingAgentId ${bookingAgentConnectId}`);
        await connectBookingAgentToDoc(menteeSessionId, bookingAgentConnectId, 'menteeSession');
      }
      const mentorMenteeSession = mentorMenteeSessionsData.filter((mmSession) => get(mmSession, 'menteeSession.user.id') === get(lead, 'id'));
      if (mentorMenteeSession.length > 0) {
        const mentorMenteeSessionId = get(mentorMenteeSession, '[0].id');
        log(`updating mentorMenteeSessionId ${mentorMenteeSessionId} with bookingAgentId ${bookingAgentConnectId}`);
        await connectBookingAgentToDoc(mentorMenteeSessionId, bookingAgentConnectId, 'mentorMenteeSession');
      }
    }
  }
};

export default updateLeadAnalyticsForPastLeads;

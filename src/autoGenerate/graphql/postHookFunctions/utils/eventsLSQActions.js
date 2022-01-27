import { get } from 'lodash';
import updateLeadSquared from '../../../../../services/leadsquared/updateLeadSquared';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const getUserNumber = async (studentProfileId) => {
  const query = `{
  studentProfile(id: "${studentProfileId}") {
    id
    parents {
      id
      user {
        id
        phone {
          number
        }
      }
    }
  }
}
`;
  const studentProfile = await callLocalGraphqlApi(query);
  return get(studentProfile, 'data.studentProfile.parents[0].user');
};

const getEventDetails = async (eventId) => {
  const query = `{
  event(id: "${eventId}") {
    utm {
      utmCampaign
      utmSource
    }
  }
}

`;
  const eventDetail = await callLocalGraphqlApi(query);
  return get(eventDetail, 'data.event.utm[0]');
};

const eventsLSQActions = async (eventId, studentProfileId, action = '') => {
  if (eventId && studentProfileId && action) {
    const parentDetail = await getUserNumber(studentProfileId);
    const eventDetail = await getEventDetails(eventId);
    const parentNumber = get(parentDetail, 'phone.number');
    const { utmCampaign, utmSource } = eventDetail;
    if (parentNumber && utmCampaign && utmSource) {
      if (action === 'eventRegistration') {
        updateLeadSquared({
          Phone: parentNumber,
        }, false, {
          ActivityEvent: 208,
          Fields: [
            {
              SchemaName: 'mx_Custom_1',
              Value: utmSource,
            },
            {
              SchemaName: 'mx_Custom_2',
              Value: utmCampaign,
            },
          ],
        });
      } else if (action === 'eventCompletion') {
        updateLeadSquared({
          Phone: parentNumber,
        }, false, {
          ActivityEvent: 210,
          Fields: [
            {
              SchemaName: 'Status',
              Value: 'Active',
            },
            {
              SchemaName: 'mx_Custom_1',
              Value: 'Present',
            },
            {
              SchemaName: 'mx_Custom_2',
              Value: utmCampaign,
            },
            {
              SchemaName: 'mx_Custom_3',
              Value: utmSource,
            },
          ],
        });
      }
    }
  }
};

export default eventsLSQActions;

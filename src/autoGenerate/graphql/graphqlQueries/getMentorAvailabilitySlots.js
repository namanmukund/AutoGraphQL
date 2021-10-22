import moment from 'moment';

const getMentorAvailabilitySlots = (date) => `
{
  mentorAvailabilitySlots(filter: {
    and:[
      { date_gte: "${moment(date).startOf('day').toISOString()}" }
      { date_lte: "${moment(date).endOf('day').toISOString()}" }
    ]
  }) {
    id
    slotName
    date
    count
    menteeSessionsMeta {
      count
    }
    mentorSessionsMeta {
      count
    }
    batchSessions{
      batch{
        type
      }
    }
  }
}

`;

export default getMentorAvailabilitySlots;

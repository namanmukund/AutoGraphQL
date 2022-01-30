import getSlotTimesInString from '../../../../utils/getSlotTimesInString';

const batchSessionQuery = (batchSessionId) => `
query{
  batchSession(id:"${batchSessionId}"){
    id
    bookingDate
    isAudit
    topic{
      id 
      order
    }
    attendance {
      student {
        id
      }
    }
    ${getSlotTimesInString()}
    batch{
      id
      code
      type
      customSessionLink
      allottedMentor{
        id
      }
    }
    sessionStatus
    mentorSession{
      id
      user{
        id
        phone {
          countryCode
          number
        }
      }
    }
    course{
        id
    }
  }
}
`;

export default batchSessionQuery;

import getSlotTimesInString from '../../../../utils/getSlotTimesInString';

const adhocSessionQuery = (adhocSessionId) => `
query{
  adhocSession(id:"${adhocSessionId}"){
    id
    bookingDate
    isAudit
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

export default adhocSessionQuery;

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
    logoutAllStudents
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
      documentType
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

export const schoolSessionOtpQuery = (batchSessionId) => `{
  schoolSessionOtps(filter: { batchSession_some: { id: "${batchSessionId}" } }) {
    id
  }
}
`;

export default batchSessionQuery;

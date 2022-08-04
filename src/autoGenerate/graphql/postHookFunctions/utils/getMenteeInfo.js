import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const menteeInfoQuery = (userId) => `
  query{
    user(id:"${userId}"){
      id
      name
      source
      utmTerm
      utmSource
      utmMedium
      utmContent
      utmCampaign
      verificationStatus
      studentProfile{
        id
        grade
        batch {
          id
          code
        }
        bookingAgent {
          id
        }
        parents{
          id
          user{
            id
            name
            email
            phone{
              number
              countryCode
            }
          }
        }
      }
    }
  }
`;

const getMenteeInfo = async (userId, context) => {
  const userInfo = await callLocalGraphqlApi(menteeInfoQuery(userId), context);
  return userInfo;
};

export default getMenteeInfo;

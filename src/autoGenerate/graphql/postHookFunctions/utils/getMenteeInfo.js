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

const getMenteeInfo = async (userId) => {
  const userInfo = await callLocalGraphqlApi(menteeInfoQuery(userId));
  return userInfo;
};

export default getMenteeInfo;

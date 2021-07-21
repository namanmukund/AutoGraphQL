import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const deleteMentorMenteeSessionQuery = async (mmsId) => {
  const DELETE_MMS_QUERY = `mutation {
    deleteMentorMenteeSession(id: "${mmsId}") {
      id
    }
  }`;
  await callLocalGraphqlApi(DELETE_MMS_QUERY);
};

export default deleteMentorMenteeSessionQuery;

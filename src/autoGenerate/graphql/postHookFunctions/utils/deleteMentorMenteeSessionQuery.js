import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const deleteMentorMenteeSessionQuery = async (mmsId, context) => {
  const DELETE_MMS_QUERY = `mutation {
    deleteMentorMenteeSession(id: "${mmsId}") {
      id
    }
  }`;
  await callLocalGraphqlApi(DELETE_MMS_QUERY, context);
};

export default deleteMentorMenteeSessionQuery;

import { callLocalGraphqlApi } from '../../../../api';

const addSessionComponentTrackerQuery = (batchSessionId) => `
mutation{
    addSessionComponentTracker(batchSessionConnectId: "${batchSessionId}", input:{}){
        id
    }
}
`;

const addSessionComponentTracker = ({ batchSessionId }) => {
  if (batchSessionId) {
    callLocalGraphqlApi(addSessionComponentTrackerQuery(batchSessionId));
  }
};

export default addSessionComponentTracker;

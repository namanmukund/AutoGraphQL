import get from 'lodash/get';
import { ifAuthorized } from '../../../utils';
import { QueryController } from '../../autoGenerate/graphql/controllers';

const BATCHSESSION_TYPE = 'BatchSession';

const batchSessionCondition = ({
  batchSessionId,
}) => [
  {
    $match: {
      id: batchSessionId,
    },
  },
  {
    $project: {
      id: 1,
      loggedInUserStatus: 1,
    },
  },
];

const validateBuddyToken = async (batchSessionId, systemId, req) => {
  const authentication = ifAuthorized(req);

  const modelQueries = new QueryController(BATCHSESSION_TYPE, authentication);

  const batchSessionRes = await modelQueries.aggregate(batchSessionCondition({
    batchSessionId,
  }));

  const loggedInUserStatuses = get(batchSessionRes, '[0].loggedInUserStatus', []);
  // Finds LoggedIn details for the currentUser
  const loggedInUserStatus = loggedInUserStatuses.find((data) => get(data, 'user.typeId') === get(req, 'currentUser.id'));
  let isBuddyTokenValid = false;
  if (loggedInUserStatus && get(loggedInUserStatus, 'systemId') === systemId) {
    isBuddyTokenValid = true;
  }
  Object.assign(req.currentUser, {
    isBuddyTokenValid,
  });
};

export default validateBuddyToken;

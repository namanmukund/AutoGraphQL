import get from 'lodash/get';
import { QueryController } from '../../autoGenerate/graphql/controllers';

const BATCHSESSION_TYPE = 'BatchSession';

const getTypeQueryController = (
  typeName,
  authentication = {
    bypass: true,
  },
) => new QueryController(typeName, authentication);

const getStudentLoggedInStatus = ({
  sessionId,
}) => [
  {
    $match: {
      id: sessionId,
    },
  },
  {
    $project: {
      id: 1,
      loggedInUserStatus: 1,
    },
  },
];

const validateBuddySystem = async (sessionId, systemId, req) => {
  const batchSessionModel = getTypeQueryController(
    BATCHSESSION_TYPE,
  );
  const batchSessionData = await batchSessionModel.aggregate(
    getStudentLoggedInStatus({
      sessionId,
    }),
  );
  const addedStudentsArray = get(batchSessionData, '[0].loggedInUserStatus', []);
  const findInArray = addedStudentsArray.find((data) => get(data, 'user.typeId') === get(req, 'currentUser.id'));
  if (findInArray && get(findInArray, 'systemId') !== systemId) {
    req.currentUser.isBuddyTokenValid = false;
  } else {
    req.currentUser.isBuddyTokenValid = true;
  }
};

export default validateBuddySystem;

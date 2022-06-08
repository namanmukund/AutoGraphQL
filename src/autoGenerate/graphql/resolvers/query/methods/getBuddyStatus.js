import get from 'lodash/get';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';
import { QueryController, MutationController } from '../../../controllers';

const BATCHSESSION_TYPE = 'BatchSession';

const checkIfExistInArray = (userId, arrayData = []) => {
  if (!userId || !arrayData.length) return false;
  const findInArray = arrayData.find((data) => get(data, 'user.typeId') === userId);
  if (!findInArray) return false;
  return true;
};

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

const getBuddyStatus = async (
  root,
  params,
) => {
  const {
    sessionId, userId, systemId, action,
  } = params;
  if (!sessionId || !action || !['add', 'delete', 'check'].includes(action)) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'Either SessionId or action type or all missing in input',
      },
    });
  }
  if (action === 'add' && (!userId || !systemId)) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'Either userConnectId or systemId or all missing in input',
      },
    });
  }
  if (action === 'check' && !userId) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'userConnectId is missing in input',
      },
    });
  }
  if (action === 'delete' && !userId) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'userConnectId is missing in input',
      },
    });
  }
  const authentication = {
    bypass: true,
  };
  const batchSessionModel = getTypeQueryController(
    BATCHSESSION_TYPE,
  );
  const batchSessionData = await batchSessionModel.aggregate(
    getStudentLoggedInStatus({
      sessionId,
    }),
  );
  const addedStudentsArray = get(batchSessionData, '[0].loggedInUserStatus', []);
  let result = false;
  const updateLoginStatusModal = new MutationController(BATCHSESSION_TYPE, authentication);
  if (action === 'check') {
    // Returns true if exist else returns false;
    result = checkIfExistInArray(userId, addedStudentsArray);
  } else if (action === 'add') {
    const isAlreadyAdded = checkIfExistInArray(userId, addedStudentsArray);
    // If alreadyAdded then it returns false, else it updates in the list and returns true;
    if (!isAlreadyAdded) {
      addedStudentsArray.push({ user: { typeId: userId, type: 'User' }, systemId });
      updateLoginStatusModal.updateOne({ id: sessionId }, {
        loggedInUserStatus: addedStudentsArray,
      });
      result = true;
    }
  } else if (action === 'delete') {
    const isAdded = checkIfExistInArray(userId, addedStudentsArray);
    // If alreadyAdded then it removes it from the list and returns true, else it returns false;
    if (isAdded) {
      const newStudentsArray = addedStudentsArray.filter((data) => get(data, 'user.typeId') !== userId);
      updateLoginStatusModal.updateOne({ id: sessionId }, {
        loggedInUserStatus: newStudentsArray,
      });
      result = true;
    }
  }
  return {
    result,
  };
};

export default getBuddyStatus;

import get from 'lodash/get';
import bcrypt from 'bcryptjs';
import { PasswordMismatchError, UnknownUserError, UserPasswordNotSetError } from '../../../../../../constants/errors';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';
import { QueryController, MutationController } from '../../../controllers';

const BATCHSESSION_TYPE = 'BatchSession';

const STUDENTPROFILE_TYPE = 'StudentProfile';

const checkIfExistInArray = (userId, arrayData = [], systemId) => {
  if (!userId || !arrayData.length) return false;
  const findInArray = arrayData.find((data) => get(data, 'user.typeId') === userId);
  if (!findInArray) return false;
  if (systemId && findInArray && get(findInArray, 'systemId') === systemId) return false;
  if (findInArray && !get(findInArray, 'isLoggedIn')) return false;
  return true;
};

const getTypeQueryController = (
  typeName,
  authentication = {
    bypass: true,
  },
) => new QueryController(typeName, authentication);

const getStudentLoggedInStatus = ({
  sessionId, project = {},
}) => [
  {
    $match: {
      id: sessionId,
    },
  },
  {
    $project: project,
  },
];

const getStudentProfileAggregation = ({
  userId,
}) => [
  {
    $match: {
      'user.typeId': userId,
    },
  },
  {
    $lookup: {
      from: 'ParentProfile',
      let: {
        parentProfileId: '$parents.typeId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $in: ['$id', '$$parentProfileId'],
            },
          },
        },
        {
          $lookup: {
            from: 'User',
            localField: 'user.typeId',
            foreignField: 'id',
            as: 'user',
          },
        },
        {
          $project: {
            user: {
              id: 1,
              password: 1,
            },
          },
        },
      ],
      as: 'parents',
    },
  },
  {
    $project: {
      parents: {
        $arrayElemAt: ['$parents', 0],
      },
    },
  },
];

const getBuddyStatus = async (
  root,
  params,
) => {
  const {
    sessionId, userId, systemId, action, password, studentIds = [],
  } = params;
  if (!sessionId || !action || !['add', 'delete', 'check', 'confirmPassword', 'markAttendance', 'logout'].includes(action)) {
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
  if (action === 'confirmPassword' && (!userId || !password)) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'userConnectId or password is missing in input',
      },
    });
  }
  if (action === 'markAttendance' && !studentIds.length) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'studentProfile Id`s is missing in input',
      },
    });
  }
  if (action === 'logout' && !studentIds.length) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'studentProfile Id`s is missing in input',
      },
    });
  }
  const project = {
    id: 1,
  };
  if (action === 'markAttendance' && studentIds.length) {
    project.attendance = 1;
  } else {
    project.loggedInUserStatus = 1;
  }
  const authentication = {
    bypass: true,
  };
  const batchSessionModel = getTypeQueryController(
    BATCHSESSION_TYPE,
  );
  const batchSessionData = await batchSessionModel.aggregate(
    getStudentLoggedInStatus({
      sessionId, project,
    }),
  );
  const addedStudentsArray = get(batchSessionData, '[0].loggedInUserStatus', []);
  let result = false;
  const updateLoginStatusModal = new MutationController(BATCHSESSION_TYPE, authentication);
  if (action === 'check') {
    // Returns true if exist else returns false;
    result = checkIfExistInArray(userId, addedStudentsArray, systemId);
  } else if (action === 'add') {
    const isAlreadyAdded = checkIfExistInArray(userId, addedStudentsArray);
    // If alreadyAdded then it returns false, else it updates in the list and returns true;
    if (!isAlreadyAdded) {
      const studentStatusIndex = addedStudentsArray.findIndex((student) => get(student, 'user.typeId') === userId);
      if (studentStatusIndex !== -1) {
        addedStudentsArray[studentStatusIndex].isLoggedIn = true;
        addedStudentsArray[studentStatusIndex].systemId = systemId;
      } else {
        addedStudentsArray.push({ user: { typeId: userId, type: 'User' }, systemId, isLoggedIn: true });
      }
      updateLoginStatusModal.updateOne({ id: sessionId }, {
        loggedInUserStatus: addedStudentsArray,
      });
      result = true;
    }
    if (!result) {
      const findInArray = addedStudentsArray.find((data) => get(data, 'user.typeId') === userId);
      if (systemId && findInArray && get(findInArray, 'systemId') === systemId) result = true;
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
  } else if (action === 'confirmPassword') {
    // It checks the password and returns true if password matches else returns false
    const userModal = getTypeQueryController(
      STUDENTPROFILE_TYPE,
    );
    const userData = await userModal.aggregate(
      getStudentProfileAggregation({
        userId,
      }),
    );
    if (!userData || !userData.length) {
      throw new UnknownUserError();
    }
    if (!get(userData, '[0].parents.user[0].password')) {
      throw new UserPasswordNotSetError();
    }
    const valid = bcrypt.compareSync(password, get(userData, '[0].parents.user[0].password'));
    if (!valid) {
      throw new PasswordMismatchError();
    }
    result = true;
  } else if (action === 'markAttendance' && studentIds && studentIds.length) {
    const attendanceArray = get(batchSessionData, '[0].attendance', []) || [];
    let isUpdated = false;
    studentIds.forEach((studentProfileId) => {
      const findStudentDataIndex = attendanceArray.findIndex((student) => get(student, 'student.typeId') === studentProfileId);
      if (findStudentDataIndex !== -1) {
        const attendanceDoc = attendanceArray[findStudentDataIndex];
        if (get(attendanceDoc, 'status') !== 'present' && !get(attendanceDoc, 'isPresent', false)) {
          isUpdated = true;
          attendanceArray[findStudentDataIndex].status = 'present';
          attendanceArray[findStudentDataIndex].isPresent = true;
        }
      }
    });
    if (isUpdated) {
      updateLoginStatusModal.updateOne({ id: sessionId }, {
        attendance: attendanceArray,
      });
    }
    result = true;
  } else if (action === 'logout' && studentIds && studentIds.length) {
    let isUpdated = false;
    studentIds.forEach((studentProfileId) => {
      const findStudentDataIndex = addedStudentsArray.findIndex((student) => get(student, 'user.typeId') === studentProfileId);
      if (findStudentDataIndex !== -1) {
        const loginStatusOfUser = addedStudentsArray[findStudentDataIndex];
        if (get(loginStatusOfUser, 'isLoggedIn')) {
          isUpdated = true;
          addedStudentsArray[findStudentDataIndex].isLoggedIn = false;
        }
      }
    });
    if (isUpdated) {
      updateLoginStatusModal.updateOne({ id: sessionId }, {
        loggedInUserStatus: addedStudentsArray,
      });
    }
    result = true;
  }
  return {
    result,
  };
};

export default getBuddyStatus;

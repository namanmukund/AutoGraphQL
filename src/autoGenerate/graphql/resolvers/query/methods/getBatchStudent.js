/*eslint-disable */
import { get } from 'lodash';
import { RollNumberMismatchMessageError } from '../../../../../../constants/errors/auth';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';
import { QueryController } from '../../../controllers';

const getTypeQueryController = (
  typeName,
  authentication = {
    bypass: true,
  },
) => new QueryController(typeName, authentication);

const getStudentProfileAggregation = ({
  batchId, studentRoll
}) => [
    {
      $match: {
        'batch.typeId': batchId,
        rollNo: studentRoll,
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
        grade: 1,
        section: 1,
        profileAvatarCode: 1,
        rollNo: 1,
        user: {
          id: 1,
          name: 1,
        },
      },
    },
  ]


const getBatchStudent = async (
  root,
  params,
  context,
  typeName,
  info,
  mutationName,
  ast,
  authentication,
) => {
  const batcStudentData = [];
  const { batchId, studentRoll } = params;
  if (!batchId || !studentRoll) {
    throw new MissingMandatoryInputInRequestError();
  }
  const studentProfileModal = getTypeQueryController(
    'StudentProfile',
  );
  const studentProfilesArray = await studentProfileModal.aggregate(
    getStudentProfileAggregation({
      batchId,
      studentRoll: studentRoll.toLowerCase(),
    }),
  );

  if (!studentProfilesArray || !studentProfilesArray.length) {
    throw new RollNumberMismatchMessageError();
  }
  studentProfilesArray.map((studentData) => {
    batcStudentData.push({
      userId: get(studentData, 'user[0].id'),
      name: get(studentData, 'user[0].name'),
      grade: get(studentData, 'grade'),
      section: get(studentData, 'section'),
      rollNo: get(studentData, 'rollNo'),
      profileAvatar: get(studentData, 'profileAvatarCode'),
    });
  });
  return batcStudentData;
};

export default getBatchStudent;

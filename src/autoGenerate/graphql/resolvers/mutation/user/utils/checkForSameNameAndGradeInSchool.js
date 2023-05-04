import { get } from 'lodash';
import { StudentWithSimilarNameAndGradeExist } from '../../../../../../../constants/errors/input';
import { QueryController } from '../../../../controllers';

const getTypeQueryController = (
  typeName,
  authentication = {
    bypass: true,
  },
) => new QueryController(typeName, authentication);

const getStudentProfileAggregation = ({
  schoolId,
  grade,
}) => [
  {
    $match: {
      'school.typeId': schoolId,
      grade,
    },
  },
  {
    $lookup: {
      from: 'User',
      let: {
        userId: '$user.typeId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$id', '$$userId'],
            },
          },
        },
        {
          $project: {
            name: 1,
          },
        },
      ],
      as: 'user',
    },
  },
  {
    $project: {
      user: {
        $arrayElemAt: ['$user', 0],
      },
    },
  },
];

const checkForSameNameAndGradeInSchool = async (schoolId, grade, childName = '') => {
  const studentProfileModel = getTypeQueryController(
    'StudentProfile',
  );
  const studentProfiles = await studentProfileModel.aggregate(getStudentProfileAggregation({
    schoolId,
    grade,
  }));
  if (studentProfiles.length) {
    const trimmedChildName = childName.trim().toLowerCase();
    const childWithSimilarNameAndGrade = studentProfiles.find((student) => get(student, 'user.name', '').trim().toLowerCase() === trimmedChildName);
    if (childWithSimilarNameAndGrade) {
      throw new StudentWithSimilarNameAndGradeExist();
    }
  }
};

export default checkForSameNameAndGradeInSchool;

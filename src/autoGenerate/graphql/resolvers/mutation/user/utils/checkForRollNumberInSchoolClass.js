import { get } from 'lodash';
import { StudentWithSimilarRollNoExist } from '../../../../../../../constants/errors/input';
import { QueryController } from '../../../../controllers';

const getTypeQueryController = (
  typeName,
  authentication = {
    bypass: true,
  },
) => new QueryController(typeName, authentication);

const getSchoolClassAggregation = ({
  schoolId,
  section,
  grade,
  rollNo,
}) => [
  {
    $match: {
      'school.typeId': schoolId,
      section,
      grade,
    },
  },
  {
    $lookup: {
      from: 'StudentProfile',
      let: {
        studentProfileId: '$students.typeId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $in: ['$id', '$$studentProfileId'],
            },
          },
        },
        {
          $project: {
            rollNo: 1,
          },
        },
        {
          $match: {
            rollNo,
          },
        },
      ],
      as: 'students',
    },
  },
  {
    $project: {
      students: {
        rollNo: 1,
      },
    },
  },
];

const checkForRollNumberInSchoolClass = async (rollNo, grade, section, schoolId) => {
  const schoolClassModel = getTypeQueryController(
    'SchoolClass',
  );
  const schoolClassesData = await schoolClassModel.aggregate(getSchoolClassAggregation({
    schoolId,
    grade,
    section,
    rollNo,
  }));
  if (schoolClassesData.length) {
    const isRollNumExist = get(schoolClassesData, '[0].students', []).find((student) => get(student, 'rollNo') === rollNo);
    if (isRollNumExist) {
      throw new StudentWithSimilarRollNoExist();
    }
  }
};

export default checkForRollNumberInSchoolClass;

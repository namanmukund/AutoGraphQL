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
      localField: 'students.typeId',
      foreignField: 'id',
      as: 'students',
    },
  },
  {
    $project: {
      id: 1,
      bookingDate: 1,
      students: {
        rollNo: 1,
      },
    },
  },
];

const checkForRollNumberInSchoolClass = async (grade, section, schoolId) => {
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

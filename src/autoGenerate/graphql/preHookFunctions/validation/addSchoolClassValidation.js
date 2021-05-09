import { GradeSectionCombinationAlreadyExists } from '../../../../../constants/errors';
import fetchSchools from './utils/checkIfGradeSectionExists';

const addSchoolClassValidation = async (params) => {
  const { schoolConnectId: schoolId, input: { grade, section } } = params;
  const schoolClasses = await fetchSchools(schoolId, grade, section);
  if (schoolClasses && schoolClasses.length > 0) {
    throw new GradeSectionCombinationAlreadyExists();
  }
  return true;
};

export default addSchoolClassValidation;

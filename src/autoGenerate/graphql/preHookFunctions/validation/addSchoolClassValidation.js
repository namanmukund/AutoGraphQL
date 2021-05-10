import { GradeSectionCombinationAlreadyExists } from '../../../../../constants/errors';
import fetchSchoolClasses from './utils/checkIfGradeSectionExists';

const addSchoolClassValidation = async (params) => {
  const { schoolConnectId: schoolId, input: { grade, section } } = params;
  const schoolClasses = await fetchSchoolClasses(null, grade, section, schoolId);
  if (schoolClasses && schoolClasses.length > 0) {
    throw new GradeSectionCombinationAlreadyExists();
  }
  return true;
};

export default addSchoolClassValidation;

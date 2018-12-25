// Fucntion will check if the arguments are from same modal then throw error
import { RelationMutationSimilarTypeArgumentError } from '../../../constants/errors';

const checkIfArgumentsAreFromSameType = (argumentKeys, typeName) => {
  if (argumentKeys[0].includes(`${typeName}Id`) && argumentKeys[1].includes(`${typeName}Code`)) {
    throw new RelationMutationSimilarTypeArgumentError();
  }
  if (argumentKeys[1].includes(`${typeName}Id`) && argumentKeys[0].includes(`${typeName}Code`)) {
    throw new RelationMutationSimilarTypeArgumentError();
  }
};

export default checkIfArgumentsAreFromSameType;

import { ifAuthorized } from '../../../../../../utils';
import { UnauthorizedOperationError } from '../../../../../../constants/errors';
import getByteCode from '../../utils/getByteCode';

const getPythonByteCode = (async (root, params, context) => {
  const authentication = ifAuthorized(context);

  if (!authentication || !authentication.app || !authentication.user) {
    throw new UnauthorizedOperationError();
  }

  const { pythonCode } = params;

  const response = await getByteCode(pythonCode);
  const { byteCode, error } = response;
  if (error) {
    return {
      error,
    };
  }
  return {
    byteCode,
  };
});

export default getPythonByteCode;

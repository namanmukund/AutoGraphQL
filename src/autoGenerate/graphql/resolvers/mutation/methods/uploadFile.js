import checkMiddlewareErrors from '../../utils/checkMiddlewareErrors';
import { ifAuthorized } from '../../../../../../utils';
import { uploadFileResolver } from '../index';

const uploadFile = (root, params, context) => {
  const { filePayload: { middlewareErrorType } } = context;
  // throw error coming from middleware
  checkMiddlewareErrors(middlewareErrorType);
  // check authentication
  const authentication = ifAuthorized(context);
  return uploadFileResolver(root, params, authentication, context);
};

export default uploadFile;

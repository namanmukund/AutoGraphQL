import mkdirp from 'mkdirp';
import formidable from 'formidable';
import objectPath from 'object-path';
import fs from 'fs';
import { includes } from 'lodash';
import { log } from '../../utils';
import {
  checkFileSizeAndExtensions,
  getAuthenticationErrorMessage,
  getFileSizeExtErrorName,
  getFileTypeName,
  resizeAndUpload,
} from './utils';

/* processes file in request; saves in local;
reads the file from local and then uploads to s3 */
function processRequestAndUploadFile(request, { uploadDir } = {}) {
  // Ensure provided upload directory exists
  let middlewareErrorType = '';
  mkdirp.sync(uploadDir);

  const form = formidable.IncomingForm({
    // Defaults to the OS temp directory
    uploadDir,
  });
  form.keepExtensions = true;
  // form.maxFieldsSize = 2;
  // Parse the multipart form request
  return new Promise((resolve, reject) => {
    form.parse(request, (error, { operations }, files) => {
      if (error) { reject(new Error(error)); }
      /*   Decode the GraphQL operation(s). This is an array if batching is
      enabled. */
      /* eslint-disable no-param-reassign */
      if (!operations) {
        // special case handling for the android app
        if (!request.headers.querystring) {
          return null;
        }
        operations = request.headers.querystring;
      }
      operations = JSON.parse(operations);
      /* eslint-enable no-param-reassign */
      // Check if files were uploaded
      const filesKeys = Object.keys(files);

      if (filesKeys.length) {
        /* File field names contain the original path to the File object in the
        GraphQL operation input variables. Relevent data for each uploaded
        file now gets placed back in the variables. */
        const operationsPath = objectPath(operations);
        filesKeys.forEach((variablesPath) => {
          const { name, type, size, path } = files[variablesPath];
          // get file type name like image/video/audio from its metadata
          /* inavlid file type can be handled by graphql I am just blocking the
          upload in case wrong type is defined
          */
          const ext = type.split('/')[1];
          const fileTypeName = getFileTypeName(type);
          // compare file size with the predefined allowed sizes
          const { isValidSize, isValidExtension } = checkFileSizeAndExtensions(
            fileTypeName,
            size,
            ext,
          );
          // fileKind has value like profilePic to know what kind of resizing is required
          const {
            variables: {
              fileKind,
              connectType,
              connectTypeField,
              connectTypeId,
            },
          } = operations;

          const modifiedFileName = `${connectTypeField}_${connectTypeId}`;
          const filePath = `${fileKind}/${connectType}/${modifiedFileName}`;

          // get authentication message
          const authenticationErrorMsg = getAuthenticationErrorMessage(request);
          if (fileKind && connectType && connectTypeField && connectTypeId) {
            if (!authenticationErrorMsg) {
              if (!isValidSize || !isValidExtension || !fileTypeName) {
                middlewareErrorType = getFileSizeExtErrorName(isValidSize, isValidExtension);
              } else {
                try {
                  const fileContent = fs.readFileSync(path);
                  if (fileContent) {
                    resizeAndUpload(fileTypeName, name, fileContent, fileKind, filePath);
                  }
                } catch (err) {
                  log(err);
                  middlewareErrorType = 'FileUploadError';
                }
              }
            } else {
              middlewareErrorType = authenticationErrorMsg;
            }
          }
          const fileInfo = {
            name: modifiedFileName,
            type: fileTypeName,
            size,
            uri: filePath,
            middlewareErrorType,
            fileKind,
            mimeType: ext,
          };
          if (includes(variablesPath, 'variables')) {
            operationsPath.set(variablesPath, fileInfo);
          } else {
            Object.assign(operations.variables, {
              file: fileInfo,
            });
          }
        });
      }
      // Provide fields for replacement request body
      resolve(operations);
      return null;
    });
  });
}

export default options => (request, response, next) => {
  // Skip if there are no uploads
  if (!request.is('multipart/form-data')) {
    next();
  }
  processRequestAndUploadFile(request, options).then((body) => {
    request.body = body;
    next();
  });
};

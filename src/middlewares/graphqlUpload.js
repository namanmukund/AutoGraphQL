import mkdirp from 'mkdirp';
import formidable from 'formidable';
import objectPath from 'object-path';
import fs from 'fs';
import cuid from 'cuid';
import {
  includes, camelCase, get, find,
} from 'lodash';
import { log } from '../../utils';
import {
  checkFileSizeAndExtensions,
  getAuthenticationErrorMessage,
  getFileSizeExtErrorName,
  getFileTypeName,
  resizeAndUpload,
} from './utils';
import callGraphqlApi from '../api/callGraphqlApi';

const checkActionTypeBeforeFileUpload = async (operations) => {
  const {
    variables: {
      connectInput: {
        typeId,
        type,
        typeField,
        fileId,
      },
    },
  } = operations;
  const typeName = camelCase(type);
  const query = `
  query{
      ${typeName}(id:"${typeId}"){
        id
        ${typeField} {
          id
          name
          uri
        }
      }
    }
  `;
  const res = await callGraphqlApi(query);
  // if connected type is not present
  if (!get(res, `data.${typeName}`)) {
    return {
      middlewareErrorType: 'DatabaseRecordNotFoundError',
    };
  }

  const file = get(res, `data.${typeName}.${typeField}`);

  // if fileId is sent then it should be available in res in both array and object case
  if (fileId) {
    if (!file
        || (file && (!Array.isArray(file) && file.id !== fileId))
         || (file && Array.isArray(file) && !find(file, { id: fileId }))) {
      return {
        middlewareErrorType: 'DatabaseRecordNotFoundError',
      };
    }
  }
  // fileId is mandatory in case of an array
  if (file && Array.isArray(file) && file.length && !fileId) {
    return {
      middlewareErrorType: 'FileIdIsMandatoryError',
    };
  }

  // if res is not available and fileId is not present then the action required is add
  if (!file || (file && Array.isArray(file) && !file.length)) {
    return {
      action: 'add',
    };
  }

  return {
    action: 'edit',
    data: fileId ? find(file, { id: fileId }) : file,
  };
};
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
    form.parse(request, async (error, { operations }, files) => {
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
      let filePayload = { action: 'add' };
      if (operations && operations.variables && operations.variables.connectInput) {
        filePayload = await checkActionTypeBeforeFileUpload(operations);
      }
      const { data, middlewareErrorType: errorBeforeUpload } = filePayload;
      middlewareErrorType = errorBeforeUpload;
      /* eslint-enable no-param-reassign */
      // Check if files were uploaded
      const filesKeys = Object.keys(files);

      if (filesKeys.length) {
        /* File field names contain the original path to the File object in the
        GraphQL operation input variables. Relevent data for each uploaded
        file now gets placed back in the variables. */
        const operationsPath = objectPath(operations);
        filesKeys.forEach((variablesPath) => {
          const {
            name, type, size, path,
          } = files[variablesPath];
          // get file type name like image/video/audio from its metadata
          /* inavlid file type can be handled by graphql I am just blocking the
          upload in case wrong type is defined
          */
          const ext = type.split('/')[1];
          const fileMimeType = type;
          const fileTypeName = getFileTypeName(type);
          // compare file size with the predefined allowed sizes
          const { isValidSize, isValidExtension } = checkFileSizeAndExtensions(
            fileTypeName,
            size,
            ext,
          );

          const {
            variables: {
              fileInput: {
                fileBucket,
              },
              connectInput,
              fileName,
            },
          } = operations;
          let modifiedFileName = '';
          let filePath = '';
          if (connectInput && connectInput.typeId && connectInput.type) {
            const {
              typeId,
              type: connectType,
              typeField,
            } = connectInput;
            modifiedFileName = (data && data.name)
              ? data.name
              : `${typeField}_${typeId}_${Date.now()}.${ext}`;
            filePath = `${fileBucket}/${connectType.toLowerCase()}/${modifiedFileName}`;
          } else {
            const rawFileName = (name && name.split('.')) ? name.split('.')[0] : name;
            modifiedFileName = `${fileName || rawFileName}_${cuid()}_${Date.now()}.${ext}`;
            filePath = `${fileBucket}/${modifiedFileName}`;
          }
          // get authentication message
          const authenticationErrorMsg = getAuthenticationErrorMessage(request);
          if (fileBucket && !middlewareErrorType) {
            if (!authenticationErrorMsg) {
              if (!isValidSize || !isValidExtension || !fileTypeName) {
                filePayload.middlewareErrorType = getFileSizeExtErrorName(
                  isValidSize,
                  isValidExtension,
                );
              } else {
                try {
                  const fileContent = fs.readFileSync(path);
                  if (fileContent) {
                    resizeAndUpload(fileTypeName, name, fileContent, fileBucket, filePath, fileMimeType);
                  }
                } catch (err) {
                  log(err);
                  filePayload.middlewareErrorType = 'FileUploadError';
                }
              }
            } else {
              filePayload.middlewareErrorType = authenticationErrorMsg;
            }
          }
          const fileInfo = {
            name: modifiedFileName,
            type: fileTypeName,
            size,
            uri: filePath,
            fileBucket,
            mimeType: ext,
            filePayload,
          };
          if (includes(variablesPath, 'variables')) {
            operationsPath.set(variablesPath, fileInfo);
          } else {
            const { fileInput } = operations.variables;
            if (fileInput) {
              Object.assign(operations.variables, {
                fileInput: fileInfo,
              });
            }
          }
        });
      }
      // Provide fields for replacement request body
      resolve(operations);
      return null;
    });
  });
}

export default (options) => (request, response, next) => {
  // Skip if there are no uploads
  if (!request.is('multipart/form-data')) {
    next();
  }
  processRequestAndUploadFile(request, options).then((body) => {
    request.body = body;
    next();
  });
};

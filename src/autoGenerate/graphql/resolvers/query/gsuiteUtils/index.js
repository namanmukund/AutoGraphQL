import { GSUITE_BASE_FOLDER_ID } from '../../../../../../constants';
import GSuiteController from '../../../controllers/GSuiteController';

const createGsuiteFileOrFolder = async (_root, params) => {
  const {
    name, mimeType, parentFolderIDs,
  } = params;
  const gSuiteController = new GSuiteController({ bypass: true });
  const ignoreDefaultVisibility = true;
  const creatingFileOrFolder = await gSuiteController.createFileOrFolder(name, mimeType, ignoreDefaultVisibility, parentFolderIDs);
  if (permission) {
    if (!updatingPermissionResponse) throw new Error('Not able to update the permission');
  }
  if (creatingFileOrFolder) return creatingFileOrFolder.data;
  throw new Error('Not able to create the file or folder');
};

const updatePermissionOfGsuiteFileOrFolder = async (root, params) => {
  const { id, permission } = params;
  const gSuiteController = new GSuiteController({ bypass: true });

  const updatingPermission = await gSuiteController.updatePermission(id, permission);
  if (updatingPermission) return updatingPermission.data;
  throw new Error('Not able to update the permission');
};

const updateParentFolderOfGsuiteFileOrFolder = async (root, params) => {
  const { childId, parentFolderIDs } = params;
  const gSuiteController = new GSuiteController({ bypass: true });

  const updatingParentFolder = await gSuiteController.updateParentDirectory(childId, parentFolderIDs);
  if (updatingParentFolder) return updatingParentFolder.data;
  throw new Error('Not able to update the directory');
};

const duplicateGsuiteFileOrFolder = async (root, params) => {
  const {
    id, name, parentFolderIDs,
  } = params;
  const gSuiteController = new GSuiteController({ bypass: true });
  const ignoreDefaultVisibility = true;
  const duiplicatingFileOrFolderResponse = await gSuiteController.duplicateFileOrFolder(id, name, ignoreDefaultVisibility, parentFolderIDs);
  if (permission) {
    const updatingPermissionResponse = await gSuiteController.updatePermission(duiplicatingFileOrFolderResponse.data.id, permission);
    if (!updatingPermissionResponse) throw new Error('Not able to fetch the data');
  }
  return duiplicatingFileOrFolderResponse.data;
};

const deleteGsuiteFileOrFolder = async (_root, params) => {
  const { id } = params;
  const gSuiteController = new GSuiteController({ bypass: true });

  const deletingFileOrFolder = await gSuiteController.deleteFileOrFolder(id);
  if (deletingFileOrFolder) return { result: true };
  throw new Error({ error: 'Not able to fetch the data' });
};

const gettingGsuiteChildFileOrFolder = async (_root, params) => {
  const { id } = params;
  const gSuiteController = new GSuiteController({ bypass: true });

  const childFileOrFolder = await gSuiteController.getDriveFiles(id);
  if (childFileOrFolder) {
    return childFileOrFolder.data.files;
  }
  throw new Error('Not able to fetch the data');
};

const getGsuiteFileOrFolderDetails = async (_root, params) => {
  const { id } = params;
  const gSuiteController = new GSuiteController({ bypass: true });
  const fileOrFolderDetails = await gSuiteController.getFileOrFolderDetails(id);
  if (fileOrFolderDetails) return fileOrFolderDetails.data;
  throw new Error('Not able to fetch the data');
};

const findOrCreateParentFolder = async (
  fileOrFolderName,
  parentFolderId,
) => {
  const gSuiteController = new GSuiteController({ bypass: true });
  const gsuiteData = await gSuiteController.getDriveFiles(parentFolderId);
  if (!gsuiteData) throw new Error('Not able to fetch the data');
  const isFolderAlreadyExists = gsuiteData.data.files.find(
    (search) => search.name === fileOrFolderName,
  );
  if (isFolderAlreadyExists) {
    return isFolderAlreadyExists.id;
  }
  const ignoreDefaultVisibility = true;
  const creatingFileOrFolder = await gSuiteController.createFileOrFolder(
    fileOrFolderName,
    'folder',
    ignoreDefaultVisibility,
    parentFolderId,
  );
  if (creatingFileOrFolder) return creatingFileOrFolder.data.id;
  throw new Error('Not able to create file or folder');
};

const createGsuiteLastRevisionFile = async (_root, params) => {
  const {
    gsuiteTempleteUrlOrFile, gsuiteFileType, studentFileCreationName, schoolName, classroomTitle,
  } = params;
  const gSuiteController = new GSuiteController({ bypass: true });
  let fileCreationResponse = {};
  let mimeType = '';
  if (gsuiteTempleteUrlOrFile !== 'null') {
    mimeType = gsuiteTempleteUrlOrFile.split('/')[3];
  }
  if (gsuiteFileType !== 'null') {
    mimeType = gsuiteFileType;
  }
  const schoolFolderId = await findOrCreateParentFolder(
    schoolName,
    GSUITE_BASE_FOLDER_ID[process.env.NODE_ENV],
  );
  const clasroomsFolderId = await findOrCreateParentFolder(
    `${classroomTitle}`,
    schoolFolderId,
  );
  const gsuiteFileTypeFolderId = await findOrCreateParentFolder(
    mimeType,
    clasroomsFolderId,
  );
  const ignoreDefaultVisibility = true;

  if (gsuiteTempleteUrlOrFile !== 'null' && gsuiteFileTypeFolderId) {
    const gsuiteId = gsuiteTempleteUrlOrFile.split('/')[5];
    fileCreationResponse = await gSuiteController.duplicateFileOrFolder(
      gsuiteId,
      studentFileCreationName,
      ignoreDefaultVisibility,
      gsuiteFileTypeFolderId,
    );
  } else if (gsuiteFileTypeFolderId !== 'null') {
    // Creating File
    fileCreationResponse = await gSuiteController.createFileOrFolder(
      studentFileCreationName,
      mimeType,
      ignoreDefaultVisibility,
      gsuiteFileTypeFolderId,
    );
  }
  if (fileCreationResponse) {
    return fileCreationResponse.data;
  }
  throw new Error('Not able to create file or folder');
};

export default {
  createGsuiteFileOrFolder, updatePermissionOfGsuiteFileOrFolder, updateParentFolderOfGsuiteFileOrFolder, duplicateGsuiteFileOrFolder, deleteGsuiteFileOrFolder, gettingGsuiteChildFileOrFolder, getGsuiteFileOrFolderDetails, createGsuiteLastRevisionFile,
};

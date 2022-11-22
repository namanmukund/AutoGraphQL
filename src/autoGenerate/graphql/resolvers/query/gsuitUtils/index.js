import { GDRIVE_BASE_ID } from '../../../../../../constants';
import GSuitController from '../../../controllers/GSuitController';

const createGsuitFileOrFolder = async (_root, params) => {
  const {
    name, mimeType, parentId, permission,
  } = params;
  const gSuitController = new GSuitController({ bypass: true });

  const creatingFileOrFolder = await gSuitController.createFileOrFolder(name, mimeType, parentId);
  if (permission) {
    const updatingPermissionResponse = await gSuitController.updatePermission(creatingFileOrFolder.data.id, permission);
    if (!updatingPermissionResponse) throw new Error('Not able to update the permission');
  }
  if (creatingFileOrFolder) return creatingFileOrFolder.data;
  throw new Error('Not able to create the file or folder');
};

const updatePermissionOfGsuitFileOrFolder = async (root, params) => {
  const { permission } = params;
  const gSuitController = new GSuitController({ bypass: true });

  const updatingPermission = await gSuitController.updatePermission(permission);
  if (updatingPermission) return updatingPermission.data;
  throw new Error('Not able to update the permission');
};

const updateParentFolderOfGsuitFileOrFolder = async (root, params) => {
  const { childId, parentId } = params;
  const gSuitController = new GSuitController({ bypass: true });

  const updatingParentFolder = await gSuitController.updateParentDirectory(childId, parentId);
  if (updatingParentFolder) return updatingParentFolder.data;
  throw new Error('Not able to update the directory');
};

const duplicateGsuitFileOrFolder = async (root, params) => {
  const {
    id, name, parentId, permission,
  } = params;
  const gSuitController = new GSuitController({ bypass: true });

  const duiplicatingFileOrFolderResponse = await gSuitController.duplicateFileOrFolder(id, name, parentId);
  if (permission) {
    const updatingPermissionResponse = await gSuitController.updatePermission(creatingFileOrFolder.data.id, permission);
    if (!updatingPermissionResponse) throw new Error('Not able to fetch the data');
  }
  return duiplicatingFileOrFolderResponse.data;
};

const deleteGsuitFileOrFolder = async (_root, params) => {
  const { id } = params;
  const gSuitController = new GSuitController({ bypass: true });

  const deletingFileOrFolder = await gSuitController.deleteFileOrFolder(id);
  if (deletingFileOrFolder) return { result: true };
  throw new Error({ error: 'Not able to fetch the data' });
};

const gettingGsuitChildFileOrFolder = async (_root, params) => {
  const { id } = params;
  const gSuitController = new GSuitController({ bypass: true });

  const childFileOrFolder = await gSuitController.getDriveFiles(id);
  if (childFileOrFolder) {
    return childFileOrFolder.data.files;
  }
  throw new Error('Not able to fetch the data');
};

const getGsuitFileOrFolderDetails = async (_root, params) => {
  const { id } = params;
  const gSuitController = new GSuitController({ bypass: true });
  const fileOrFolderDetails = await gSuitController.getFileOrFolderDetails(id);
  if (fileOrFolderDetails) return fileOrFolderDetails.data;
  throw new Error('Not able to fetch the data');
};

const findOrCreateParentFolder = async (
  fileOrFolderName,
  parentFolderId,
) => {
  const gSuitController = new GSuitController({ bypass: true });
  const gsuitData = await gSuitController.getDriveFiles(parentFolderId);
  if (!gsuitData) throw new Error('Not able to fetch the data');
  const isFolderAlreadyExists = gsuitData.data.files.find(
    (search) => search.name === fileOrFolderName,
  );
  if (isFolderAlreadyExists) {
    return isFolderAlreadyExists.id;
  }
  const creatingFileOrFolder = await gSuitController.createFileOrFolder(
    fileOrFolderName,
    'folder',
    parentFolderId,
  );
  if (creatingFileOrFolder) return creatingFileOrFolder.data.id;
  throw new Error('Not able to create file or folder');
};

const createGsuitLastRevisionFile = async (_root, params) => {
  const {
    gsuitTempleteUrlOrFile, gsuitFileType, studentFileCreationName, schoolName, classroomTitle,
  } = params;
  const gSuitController = new GSuitController({ bypass: true });
  let fileCreationResponse = {};
  let mimeType = '';
  if (gsuitTempleteUrlOrFile !== 'null') {
    mimeType = gsuitTempleteUrlOrFile.split('/')[3];
  }
  if (gsuitFileType !== 'null') {
    mimeType = gsuitFileType;
  }
  const schoolFolderId = await findOrCreateParentFolder(
    schoolName,
    GDRIVE_BASE_ID,
  );
  const clasroomsFolderId = await findOrCreateParentFolder(
    `${classroomTitle}`,
    schoolFolderId,
  );
  const gsuitFileTypeFolderId = await findOrCreateParentFolder(
    mimeType,
    clasroomsFolderId,
  );

  if (gsuitTempleteUrlOrFile !== 'null' && gsuitFileTypeFolderId) {
    const gsuitId = gsuitTempleteUrlOrFile.split('/')[5];
    fileCreationResponse = await gSuitController.duplicateFileOrFolder(
      gsuitId,
      studentFileCreationName,
      gsuitFileTypeFolderId,
    );
  } else if (gsuitFileTypeFolderId !== 'null') {
    // Creating File
    fileCreationResponse = await gSuitController.createFileOrFolder(
      studentFileCreationName,
      mimeType,
      gsuitFileTypeFolderId,
    );
  }
  if (fileCreationResponse) {
    await gSuitController.updatePermission({ id: fileCreationResponse.data.id, role: 'writer', type: 'anyone' });
    return fileCreationResponse.data;
  }
  throw new Error('Not able to create file or folder');
};

export default {
  createGsuitFileOrFolder, updatePermissionOfGsuitFileOrFolder, updateParentFolderOfGsuitFileOrFolder, duplicateGsuitFileOrFolder, deleteGsuitFileOrFolder, gettingGsuitChildFileOrFolder, getGsuitFileOrFolderDetails, createGsuitLastRevisionFile,
};

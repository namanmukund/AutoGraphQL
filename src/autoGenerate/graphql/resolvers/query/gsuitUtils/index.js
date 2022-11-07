import GSuitController from '../../../controllers/GSuitController';

const gsuitCreateFileOrFolder = async (_root, params) => {
  try {
    const {
      name, mimeType, parentId, permission,
    } = params;
    const gsuitController = new GSuitController();
    const creatingFileOrFolder = await gsuitController.createFileOrFolder(name, mimeType, parentId);
    if (permission) {
      await gsuitController.updatePermission(creatingFileOrFolder.data.id, permission);
    }
  } catch (e) {
    throw new Error(e);
  }
  return creatingFileOrFolder.data;
};

const gsuitUpdatePermissionOfFileOrFolder = async (root, params) => {
  const { id, permission } = params;
  const gsuitController = new GSuitController();
  const updatingPermission = await gsuitController.updatePermission(id, permission);
  return updatingPermission.data;
};

const gsuitUpdateParentFolderOfFileOrFolder = async (root, params) => {
  const { childId, parentId } = params;
  const gsuitController = new GSuitController();
  const updatingParentFolder = await gsuitController.updateParentDirectory(childId, parentId);
  return updatingParentFolder.data;
};

const gsuitDuplicateFileOrFolder = async (root, params) => {
  const {
    id, name, parentId, permission,
  } = params;
  const gsuitController = new GSuitController();
  const duiplicatingFileOrFolderResponse = await gsuitController.duplicateFileOrFolder(id, name, parentId);
  if (permission) {
    await gsuitController.updatePermission(creatingFileOrFolder.data.id, permission);
  }
  return duiplicatingFileOrFolderResponse.data;
};

const gsuitDeleteFileOrFolder = async (_root, params) => {
  const { id } = params;
  const gsuitController = new GSuitController();
  const deletingFileOrFolder = await gsuitController.deleteFileOrFolder(id);
  return deletingFileOrFolder.data;
};

const gsuitGettingChildFileOrFolder = async (_root, params) => {
  const { id } = params;
  const gsuitController = new GSuitController();
  const childFileOrFolder = await gsuitController.getDriveFiles(id);
  return childFileOrFolder.data;
};

const gsuitGetFileOrFolderDetails = async (_root, params) => {
  const { id } = params;
  const gsuitController = new GSuitController();
  const fileOrFolderDetails = await gsuitController.getFileOrFolderDetails(id);
  return fileOrFolderDetails.data;
};

export default {
  gsuitCreateFileOrFolder, gsuitUpdatePermissionOfFileOrFolder, gsuitUpdateParentFolderOfFileOrFolder, gsuitDuplicateFileOrFolder, gsuitDeleteFileOrFolder, gsuitGettingChildFileOrFolder, gsuitGetFileOrFolderDetails,
};

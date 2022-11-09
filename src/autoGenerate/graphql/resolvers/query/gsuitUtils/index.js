import GSuitController from '../../../controllers/GSuitController';

const createGsuitFileOrFolder = async (_root, params) => {
  const {
    name, mimeType, parentId, permission,
  } = params;
  const gsuitController = new GSuitController();
  const creatingFileOrFolder = await gsuitController.createFileOrFolder(name, mimeType, parentId);
  if (permission) {
    const updatingPermissionResponse = await gsuitController.updatePermission(creatingFileOrFolder.data.id, permission);
    if (!updatingPermissionResponse) throw new Error('Not able to update the permission');
  }
  if (creatingFileOrFolder) return creatingFileOrFolder.data;
  throw new Error('Not able to create the file or folder');
};

const updatePermissionOfGsuitFileOrFolder = async (root, params) => {
  const { id, permission } = params;
  const gsuitController = new GSuitController();
  const updatingPermission = await gsuitController.updatePermission(id, permission);
  if (updatingPermission) return updatingPermission.data;
  throw new Error('Not able to update the permission');
};

const updateParentFolderOfGsuitFileOrFolder = async (root, params) => {
  const { childId, parentId } = params;
  const gsuitController = new GSuitController();
  const updatingParentFolder = await gsuitController.updateParentDirectory(childId, parentId);
  if (updatingParentFolder) return updatingParentFolder.data;
  throw new Error('Not able to update the directory');
};

const duplicateGsuitFileOrFolder = async (root, params) => {
  const {
    id, name, parentId, permission,
  } = params;
  const gsuitController = new GSuitController();
  const duiplicatingFileOrFolderResponse = await gsuitController.duplicateFileOrFolder(id, name, parentId);
  if (permission) {
    const updatingPermissionResponse = await gsuitController.updatePermission(creatingFileOrFolder.data.id, permission);
    if (!updatingPermissionResponse) throw new Error('Not able to fetch the data');
  }
  return duiplicatingFileOrFolderResponse.data;
};

const deleteGsuitFileOrFolder = async (_root, params) => {
  const { id } = params;
  const gsuitController = new GSuitController();
  const deletingFileOrFolder = await gsuitController.deleteFileOrFolder(id);
  if (deletingFileOrFolder) return 'File or folder deleted successfuly.';
  throw new Error('Not able to fetch the data');
};

const gettingGsuitChildFileOrFolder = async (_root, params) => {
  const { id } = params;
  const gsuitController = new GSuitController();
  const childFileOrFolder = await gsuitController.getDriveFiles(id);
  if (childFileOrFolder) {
    return childFileOrFolder.data.files;
  }
  throw new Error('Not able to fetch the data');
};

const getGsuitFileOrFolderDetails = async (_root, params) => {
  const { id } = params;
  const gsuitController = new GSuitController();
  const fileOrFolderDetails = await gsuitController.getFileOrFolderDetails(id);
  if (fileOrFolderDetails) return fileOrFolderDetails.data;
  throw new Error('Not able tp fetch the data');
};

export default {
  createGsuitFileOrFolder, updatePermissionOfGsuitFileOrFolder, updateParentFolderOfGsuitFileOrFolder, duplicateGsuitFileOrFolder, deleteGsuitFileOrFolder, gettingGsuitChildFileOrFolder, getGsuitFileOrFolderDetails,
};

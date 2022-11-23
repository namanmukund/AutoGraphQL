import { google } from 'googleapis';
import { credentials } from '../../../../config/gsuite';
import { GSUITE_ACCESS_SCOPES, GSUITE_FILE_TYPES } from '../../../../constants';
import MasterController from './MasterController';

class GSuiteController extends MasterController {
    #googleAuth;

    constructor(authentication) {
      const model = '';
      super(model, authentication);
      this.#googleAuth = new google.auth.GoogleAuth({
        credentials,
        scopes: GSUITE_ACCESS_SCOPES,
      });
    }

    // eslint-disable-next-line class-methods-use-this
    validateType(type) {
      if (GSUITE_FILE_TYPES.includes(type)) return true;
      return false;
    }

    getClientInstanceByType = (type) => {
      const version = 'v3';
      const googleAuth = this.#googleAuth;
      if (!this.validateType(type)) throw Error('Invalid Instance Type');
      if (google[type]) return google[type]({ version, auth: googleAuth });
      throw Error('Gsuite instance type does not exists');
    }

    getDriveFiles = (parentFolderId) => {
      const driveController = this.getClientInstanceByType('drive');
      let requestBody = {};
      if (parentFolderId) {
        requestBody = {
          fields: '*',
          q: `'${parentFolderId}' in parents and trashed=false`,
        };
      } else {
        requestBody = {
          fields: '*',
        };
      }
      return driveController.files.list(requestBody);
    }

    // ID_OF_THE_FOLDER is related to id of it's parent folder
    createFileOrFolder = async (name, mimeType, parentFolderIDs) => {
      const driveController = this.getClientInstanceByType('drive');
      let requestBody = {};
      if (parentFolderIDs) {
        requestBody = {
          mimeType: `application/vnd.google-apps.${mimeType}`,
          name,
          parents: [parentFolderIDs],
        };
      } else {
        requestBody = {
          mimeType: `application/vnd.google-apps.${mimeType}`,
          name,
        };
      }
      const newFolder = await driveController.files.create({
        fields: '*',
        requestBody,
      });

      return newFolder;
    }

    updateParentDirectory = async (currentFileId, parentFolderId) => {
      const driveController = this.getClientInstanceByType('drive');
      try {
        return driveController.files.update({
          fileId: currentFileId,
          addParents: parentFolderId,
          fields: 'id, parents',
        });
      } catch (err) {
        throw new Error(err);
      }
    }

    duplicateFileOrFolder = async (ID_OF_THE_FILE, name, parentFolderIDs) => {
      const driveController = this.getClientInstanceByType('drive');
      let requestBody = {};
      if (parentFolderIDs) {
        requestBody = {
          name,
          parents: [parentFolderIDs],
        };
      } else {
        requestBody = {
          name,
        };
      }
      const newFile = await driveController.files.copy({
        fields: '*',
        fileId: ID_OF_THE_FILE,
        requestBody,
      });
      return newFile;
    }

    // properties are obj of {type,role,emailAddress,domain} if type is "user" or "group" must provide emailAddress and for "domain" provide domain
    updatePermission = async (properties) => {
      const driveController = this.getClientInstanceByType('drive');
      let resource = {};

      if (properties && (properties.type === 'user' || properties.type === 'group')) {
        resource = {
          role: properties.role,
          type: properties.type,
          emailAddress: properties.emailAddress,
        };
      } else if (properties.type === 'domian') {
        resource = {
          role: properties.role,
          type: properties.type,
          domain: properties.domain,
        };
      } else {
        resource = {
          role: properties.role,
          type: 'anyone',
        };
      }
      return driveController.permissions.create({
        fields: '*',
        fileId: properties.id,
        resource,
      });
    }

    deleteFileOrFolder = async (id) => {
      const driveController = this.getClientInstanceByType('drive');
      return driveController.files.delete({
        fields: '*',
        fileId: id,
      });
    }

    getFileOrFolderDetails = async (id) => {
      const driveController = this.getClientInstanceByType('drive');
      try {
        return driveController.files.get({
          fields: '*',
          fileId: id,
        });
      } catch (err) {
        throw new Error('Not enough access permission');
      }
    }
}

export default GSuiteController;

import { google } from 'googleapis';

class GSuitController {
    #auth;

    constructor() {
      this.#auth = new google.auth.GoogleAuth({
        keyFile: './src/autoGenerate/graphql/controllers/credentials.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.appdata', 'https://www.googleapis.com/auth/drive.photos.readonly'],
      });
    }

    // eslint-disable-next-line class-methods-use-this
    validateType(type) {
      if (['drive', 'spreadsheet', 'presentation', 'document'].includes(type)) return true;
      return false;
    }

    getClientInstanceByType = (type, version) => {
      const auth = this.#auth;
      if (!this.validateType(type)) throw Error(`[${type}]({ ${version}, ${auth} }) Invalid Instance Type`);
      return google[type]({ version, auth });
    }

    getDriveFiles = (ID_OF_THE_FOLDER) => {
      const drives = this.getClientInstanceByType('drive', 'v3');
      if (ID_OF_THE_FOLDER) {
        return drives.files.list({
          fields: '*',
          q: `'${ID_OF_THE_FOLDER}' in parents and trashed=false`,
        });
      }
      return drives.files.list({
        fields: '*',
      });
    }

    // ID_OF_THE_FOLDER is related to id of it's parent folder
    createFileOrFolder = async (name, mimeType, parentId) => {
      const drives = this.getClientInstanceByType('drive', 'v3');
      let requestBody = {};
      if (parentId) {
        requestBody = {
          mimeType: `application/vnd.google-apps.${mimeType}`,
          name,
          parents: [parentId],
        };
      } else {
        requestBody = {
          mimeType: `application/vnd.google-apps.${mimeType}`,
          name,
        };
      }
      const newFolder = await drives.files.create({
        fields: '*',
        requestBody,
      });

      return newFolder;
    }

    updateParentDirectory = async (childId, parentId) => {
      const drives = this.getClientInstanceByType('drive', 'v3');
      try {
        return drives.files.update({
          fileId: childId,
          addParents: parentId,
          fields: 'id, parents',
        });
      } catch (err) {
        throw new Error(err);
      }
    }

    duplicateFileOrFolder = async (ID_OF_THE_FILE, name, parentId) => {
      const drives = this.getClientInstanceByType('drive', 'v3');
      let requestBody = {};
      if (parentId) {
        requestBody = {
          name,
          parents: [parentId],
        };
      } else {
        requestBody = {
          name,
        };
      }
      const newFile = await drives.files.copy({
        fields: '*',
        fileId: ID_OF_THE_FILE,
        requestBody,
      });
      return newFile;
    }

    // properties are obj of {type,role,emailAddress,domain} if type is "user" or "group" must provide emailAddress and for "domain" provide domain
    updatePermission = async (id, properties) => {
      const drives = this.getClientInstanceByType('drive', 'v3');
      let resource = {};

      if (properties.type === 'user' || properties.type === 'group') {
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
      return drives.permission.create({
        fields: '*',
        fileId: id,
        resource,
      });
    }

    deleteFileOrFolder = async (id) => {
      const drives = this.getClientInstanceByType('drive', 'v3');
      return drives.files.delete({
        fields: '*',
        fileId: id,
      });
    }

    getFileOrFolderDetails = async (id) => {
      const drives = this.getClientInstanceByType('drive', 'v3');
      try {
        return drives.files.get({
          fields: '*',
          fileId: id,
        });
      } catch (err) {
        throw new Error('Not enough access permission');
      }
    }
}

export default GSuitController;

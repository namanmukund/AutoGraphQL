import { google } from 'googleapis';

// const nameCase = (result) => {
//     if ((typeof result === 'string') && (result !== '')) {
//       let resultString = result.trim().toLowerCase();

//       // Split names on regex whitespace, dash or apostrophe, workaround for
//       // Javascript regex word boundary \b splitting on unicode characters
//       const splitters = [
//         { s: /\s/, r: ' ' },
//         { s: /-/, r: '-' },
//         { s: /'/, r: "'" },
//         { s: /"/, r: '"' },
//         { s: /\(/, r: '(' },
//         { s: /\./, r: '.' },
//       ];

//       for (let i = 0; i < splitters.length; i += 1) {
//         const elArr = resultString.split(splitters[i].s);
//         for (let j = 0; j < elArr.length; j += 1) {
//           elArr[j] = elArr[j].charAt(0).toUpperCase() + elArr[j].slice(1);
//         }
//         resultString = elArr.join(splitters[i].r);
//       }

//       // Name case Mcs and Macs
//       // Exclude names with 1-2 letters after prefix like Mack, Macky, Mace
//       // Exclude names ending in a,c,i,o, or j are typically Polish or Italian
//       if (
//         new RegExp(/\bMac[A-Za-z]{2,}[^aciozj]\b/).test(resultString)
//          || new RegExp(/\bMc/).test(resultString)
//       ) {
//         resultString = resultString.replace(/\b(Ma?c)([A-Za-z]+)/, (x, y, z) => y + z.charAt(0).toUpperCase() + z.substring(1));

//         // Now correct for "Mac" exceptions
//         resultString = resultString
//           .replace(/\bMacEvicius\b/, 'Macevicius')
//           .replace(/\bMacHado\b/, 'Machado')
//           .replace(/\bMacHar\b/, 'Machar')
//           .replace(/\bMacHin\b/, 'Machin')
//           .replace(/\bMacHlin\b/, 'Machlin')
//           .replace(/\bMacIas\b/, 'Macias')
//           .replace(/\bMacIulis\b/, 'Maciulis')
//           .replace(/\bMacKie\b/, 'Mackie')
//           .replace(/\bMacKle\b/, 'Mackle')
//           .replace(/\bMacKlin\b/, 'Macklin')
//           .replace(/\bMacQuarie\b/, 'Macquarie')
//           .replace(/\bMacOmber\b/, 'Macomber')
//           .replace(/\bMacIn\b/, 'Macin')
//           .replace(/\bMacKintosh\b/, 'Mackintosh')
//           .replace(/\bMacKen\b/, 'Macken')
//           .replace(/\bMacHen\b/, 'Machen')
//           .replace(/\bMacHiel\b/, 'Machiel')
//           .replace(/\bMacIol\b/, 'Maciol')
//           .replace(/\bMacKell\b/, 'Mackell')
//           .replace(/\bMacKlem\b/, 'Macklem')
//           .replace(/\bMacKrell\b/, 'Mackrell')
//           .replace(/\bMacLin\b/, 'Maclin')
//           .replace(/\bMacKey\b/, 'Mackey')
//           .replace(/\bMacKley\b/, 'Mackley')
//           .replace(/\bMacHell\b/, 'Machell')
//           .replace(/\bMacHon\b/, 'Machon');
//       }

//       // And correct Mac exceptions otherwise missed
//       resultString = resultString
//         .replace(/\bMacmurdo/, 'MacMurdo')
//         .replace(/\bMacisaac/, 'MacIsaac')

//       // Fixes for "son (daughter) of" etc. in various languages.
//         .replace(/\bAl(?=\s+\w)/g, 'al') // al Arabic or forename Al.
//         .replace(/\bAp\b/g, 'ap') // ap Welsh.
//         .replace(/\bBen(?=\s+\w)\b/g, 'ben') // ben Hebrew or forename Ben.
//         .replace(/\bDell([ae])\b/g, 'dell$1') // della and delle Italian.
//         .replace(/\bD([aeiu])\b/g, 'd$1') // da, de, di Italian; du French.
//         .replace(/\bDe([lr])\b/g, 'de$1') // del Italian; der Dutch/Flemish.
//         .replace(/\bEl\b/g, 'el') // el Greek
//         .replace(/\bLa\b/g, 'la') // la French
//         .replace(/\bL([eo])\b/g, 'l$1') // lo Italian; le French.
//         .replace(/\bVan(?=\s+\w)/g, 'van') // van German or forename Van.
//         .replace(/\bVon\b/g, 'von') // von Dutch/Flemish

//       // Fixes for roman numeral names, e.g. Henry VIII
//         .replace(
//           /\b(?:\d{4}|(?:[IVX])(?:X{0,3}I{0,3}|X{0,2}VI{0,3}|X{0,2}I?[VX]))$/i,
//           (v) => v.toUpperCase(),
//         )

//       // Nation of Islam 2X, 3X, etc. names
//         .replace(/\b[0-9](x)\b/, (v) => v.toUpperCase())

//       // Somewhat arbitrary rule where two letter combos not containing vowels should be capitalized
//       // fixes /JJ Abrams/ and /JD Salinger/
//       // With some exceptions
//         .replace(
//           /\b[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{2}\s/,
//           (v) => v.toUpperCase(),
//         )
//         .replace(/\bMR\s/, 'Mr')
//         .replace(/\bMS\s/, 'Ms')
//         .replace(/\bDR\s/, 'Dr')
//         .replace(/\bST\s/, 'St')
//         .replace(/\bJR\s/, 'Jr')
//         .replace(/\bSR\s/, 'Sr')
//         .replace(/\bLT\s/, 'Lt')

//       // lowercase words
//         .replace(/\bThe\b/g, 'the')
//         .replace(/\bOf\b/g, 'of')
//         .replace(/\bAnd\b/g, 'and')
//         .replace(/\bY\s/g, 'y')

//       // strip extra spaces
//         .replace(/\s{2,}/g, ' ');

//       // force first character to be uppercase
//       return resultString.charAt(0).toUpperCase() + resultString.substring(1);
//     }
//     return result;
//   }

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

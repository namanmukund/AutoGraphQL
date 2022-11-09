import { get } from 'lodash';
import { userTopicTypeStatus, GDRIVE_BASE_ID } from '../../../../constants';
import getInfoFromParams from './utils/getInfoFromParams';
import parseTopicComponentResultData from './utils/parseTopicComponentResultData';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import { MENTEE } from '../../../../constants/roles';
import getUserActiveClassroom, {
  getStudentProfile,
} from '../../../../utils/getUserActiveClassroom';
import { authenticateUser } from '../../../../utils';
import { GSuitController } from '../controllers';

const filterAndDeleteIfDupicate = (resultArray, context) => {
  const uniqueBlockBasedPractice = [];
  const uniqueIds = [];
  const blockbasedPracticeToBeDeleted = [];
  resultArray.forEach((result) => {
    if (!uniqueIds.includes(result.blockBasedPractice.typeId)) {
      uniqueBlockBasedPractice.push(result);
      uniqueIds.push(result.blockBasedPractice.typeId);
    } else {
      blockbasedPracticeToBeDeleted.push(result.id);
    }
  });
  blockbasedPracticeToBeDeleted.forEach((id) => {
    callLocalGraphqlApi(
      {
        query: `
        mutation {
          deleteUserBlockBasedPractice(
            id: "${id}"
          ) {
            id
          }
        }
      `,
      },
      context,
    );
  });
  return uniqueBlockBasedPractice;
};

// query to add UserBlockBasedPractice if it is not already present for user, blockBasedProjectId and topic id
const addUserBlockBasedPracticeMutation = (
  userId,
  topicId,
  courseId,
  blockBasedPracticeId,
  gsuitResponse,
  gsuitResponseString,
) => `
  mutation{
    addUserBlockBasedPractice(
    userConnectId:"${userId}"
    topicConnectId:"${topicId}"
    ${courseId ? `courseConnectId:"${courseId}"` : ''}
    ${blockBasedPracticeId ? `blockBasedPracticeConnectId:"${blockBasedPracticeId}"` : ''}
    input:{
        status: ${userTopicTypeStatus.incomplete}
        ${gsuitResponse && gsuitResponse.webViewLink ? `answerLink: ${gsuitResponse.webViewLink}` : ''}
        ${gsuitResponseString}
    }
    ){
      id
      user{
        id
      }
      topic{
        id
      }
      blockBasedPractice{
        id
      }
      answerLink
      attachments {
        id
        uri
      }
      savedBlocks
    }
  }
`;

const findOrCreateParentFolder = async (
  fileOrFolderName,
  parentFolderId,
) => {
  const gSuitController = new GSuitController();
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

const createGsuitFile = async (
  practiceResult,
  studentFileCreationName,
  schoolName,
  classroomTitle,
) => {
  const gSuitController = new GSuitController();
  let fileCreationResponse = {};
  let gsuitFileType = '';
  if (practiceResult.gsuitTempleteURL) {
    gsuitFileType = practiceResult.gsuitTempleteURL.split('/')[3];
  } else {
    gsuitFileType = practiceResult.gsuitFileType;
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
    gsuitFileType,
    clasroomsFolderId,
  );

  if (practiceResult.gsuitTempleteURL) {
    const gsuitId = practiceResult.gsuitTempleteURL.split('/')[5];
    fileCreationResponse = await gSuitController.duplicateFileOrFolder(
      gsuitId,
      studentFileCreationName,
      gsuitFileTypeFolderId,
    );
  } else {
    // Creating File
    fileCreationResponse = await gSuitController.createFileOrFolder(
      studentFileCreationName,
      practiceResult.gsuitFileType,
      gsuitFileTypeFolderId,
    );
  }
  return fileCreationResponse.data;
};

const getIdArrForQuery = (idArr) => {
  let arr = '';
  if (idArr) {
    idArr.forEach((id) => {
      arr += `"${id}",`;
    });
    if (arr.length && arr[arr.length - 1] === ',') {
      arr.substring(0, arr.length - 1);
    }
  }
  return arr;
};

/*
If userBlockBasedPractice document does not exist for provided combination of user id, topic id & blockBasedProjectId.
It will be created and returned to tekie app.
Document contains all the necessary information needed on page along
with the next component.
*/
const userBlockBasedPracticePostHookMethod = async (input, params, context) => {
  if (typeof input === 'object' && get(input, 'id')) {
    return input;
  }
  /* eslint-disable prefer-const */
  let {
    userId,
    topicId,
    courseId,
    blockBasedPracticeId,
    blockBasedPracticeIds,
  } = getInfoFromParams(params, 'blockBasedPractice');

  let resultArray = [];

  // In case there is no topic id or blockBasedPracticeId/blockBasedPracticeIds,
  // empty data will be sent
  if (!topicId || !(blockBasedPracticeId || blockBasedPracticeIds.length > 0)) {
    return input || resultArray;
  }

  if (blockBasedPracticeId) {
    blockBasedPracticeIds = [blockBasedPracticeId];
  }

  let blockBasedPracticeNotCreated = [];

  /*
    checking if document is already present in collection for user and topic id,
    returning input in that case
    if it is not already present, we will add a new document with default data
  */
  if (input && input.length) {
    const inputArray = Array.isArray(input) ? input : [input];
    const userBlockBasedPracticeIdsInInput = inputArray.map((item) => get(item, 'blockBasedPractice.typeId'));
    blockBasedPracticeNotCreated = blockBasedPracticeIds.filter(
      (blockBasedPracticeIdInParam) => !userBlockBasedPracticeIdsInInput.includes(blockBasedPracticeIdInParam),
    );
    if (blockBasedPracticeNotCreated.length === 0) {
      const uniqueBlockBasedPractice = filterAndDeleteIfDupicate(
        inputArray,
        context,
      );
      return uniqueBlockBasedPractice;
    }
  } else {
    blockBasedPracticeNotCreated = blockBasedPracticeIds;
  }

  if (
    get(context, 'userRoleFromContext') && get(context, 'userRoleFromContext') !== MENTEE
  ) {
    return input;
  }

  const blockBasedPracticesRes = await callLocalGraphqlApi(
    `
      {blockBasedProjects(filter:{
        id_in: [${getIdArrForQuery(blockBasedPracticeNotCreated)}]
      }){
        gsuitFileType
        gsuitTempleteURL
        layout
        id
        title
      }
    }
    `,
    context,
  );

  // Get username classroom school grade
  const activeClassroom = await getUserActiveClassroom(context, { courseId });
  const getStudentProfileData = await getStudentProfile(context);
  const classroomTitle = get(activeClassroom, 'classroomTitle');
  const schoolName = get(activeClassroom, 'school.name');
  const userData = authenticateUser(context);
  const userName = get(userData, 'name', '');
  const grade = get(getStudentProfileData, 'grade');
  const section = get(getStudentProfileData, 'section');
  let gradeSection;
  if (grade && section) gradeSection = `${grade} ${section}`;

  /* eslint-disable no-restricted-syntax */
  /* eslint-disable no-await-in-loop */
  for (const practiceId of blockBasedPracticeNotCreated) {
    // Filter blockBasedProject
    const blockBasedProjects = get(blockBasedPracticesRes, 'data.blockBasedProjects', {});
    const practiceResult = blockBasedProjects.find(
      (practiceResultData) => practiceResultData.id === practiceId,
    );
    let studentFileCreationName = '';
    if (userName && gradeSection && practiceResult && practiceResult.title) studentFileCreationName = `${userName}-${gradeSection}-${practiceResult.title}`;
    let fileCreationResponse = {};
    if (practiceResult.layout === 'gsuit' && studentFileCreationName) {
      fileCreationResponse = await createGsuitFile(
        practiceResult,
        studentFileCreationName,
        schoolName,
        classroomTitle,
      );
    }

    //  if layout==gsuit => duplicateURL or create
    // Step 4
    // store in GsuitFile object
    let gsuitResponseString = '';
    if (fileCreationResponse) {
      gsuitResponseString = '{gsuitFile: {';
      if (fileCreationResponse.id) gsuitResponseString += `fileId: '${fileCreationResponse.id}',`;
      if (fileCreationResponse.name) gsuitResponseString += `name: '${fileCreationResponse.name}',`;
      if (fileCreationResponse.webViewLink) gsuitResponseString += `url: '${fileCreationResponse.webViewLink}',`;
      if (fileCreationResponse.hasThumbnail) gsuitResponseString += `thumbnailUrl: 'https://drive.google.com/thumbnail?sz=w640&id=${fileCreationResponse.id}',`;
      if (fileCreationResponse.mimeType) gsuitResponseString += `mimeType : '${fileCreationResponse.mimeType}',`;
      if (fileCreationResponse.parents) gsuitResponseString += `parentsId: '${fileCreationResponse.parents}',`;
      if (fileCreationResponse.iconLink) gsuitResponseString += `iconLink: '${fileCreationResponse.iconLink}',`;
      if (fileCreationResponse.createdTime) gsuitResponseString += `createdTime: '${fileCreationResponse.createdTime}'`;
      gsuitResponseString += '}}';
    }
    const gsuitSuitMeta = fileCreationResponse;
    /*
      adding UserBlockBasedPractice document
    */
    const result = await callLocalGraphqlApi(
      addUserBlockBasedPracticeMutation(
        userId,
        topicId,
        courseId,
        practiceId,
        gsuitSuitMeta,
        gsuitResponseString,
      ),
      context,
    );
    if (result) {
      /*
        parsing data 'addUserBlockBasedPractice' so that the logic implemented ahead can read data is
        desired format and return the same.
        Example: suppose client has asked for title and order of topic,
        In that case he will get title and order only. And this is happening when we parse
        data as below. If parsing is not done, it is returning empty data.
        */
      const addUserBlockBasedPracticeResult = get(
        result,
        'data.addUserBlockBasedPractice',
      );
      if (addUserBlockBasedPracticeResult) {
        resultArray.push(
          parseTopicComponentResultData(
            addUserBlockBasedPracticeResult,
            'blockBasedPractice',
          ),
        );
      }
    }
  }

  if (input && input.length) {
    resultArray = [...resultArray, ...input];
  }

  resultArray = filterAndDeleteIfDupicate(resultArray, context);
  return resultArray;
};

export default userBlockBasedPracticePostHookMethod;

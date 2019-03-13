import models from '../../../models';
import deleteFromS3 from '../../../../middlewares/utils/deleteFromS3';

/* nestedDisconnectObjInfo
question:{ relationName: 'QuestionQuizDump',
nestedFieldName: 'question',
nestedDataType: 'QuizAttemptedQuestion',
typeName: 'UserActivityDump',
relatedDataType: 'QuestionBank',
removeOperationType: 'pop',
relatedFieldName: 'fromQuizInDump',
isRelatedFieldAList: true,
data:
 [ { _id: 5c7ef22f3ffc36e02c18bc6a,
     typeId: 'cjrthr04t001j1ht9n75x6hdk',
     type: 'QuestionBank' } ] }
*/
const removeConnectionWhenDisconnected = (
  targetUpdateId,
  nestedDisconnectObjInfo,
) => {
  const promiseArray = [];

  Object.keys(nestedDisconnectObjInfo).forEach((nestedField) => {
    const {
      data,
      relatedFieldName,
      relatedDataType,
      isRelatedFieldAList,
    } = nestedDisconnectObjInfo[nestedField];
    if (data && data.length) {
      const idToBePulled = data.map(doc => doc.typeId);
      const searchObj = {
        id: {
          $in: idToBePulled,
        },
      };
      let updateObject = {};
      if (isRelatedFieldAList) {
        // extract relation from array
        updateObject = {
          $pull: {
            [relatedFieldName]: { typeId: targetUpdateId },
          },
        };
      } else if (relatedDataType === 'File') {
        // find file and remove if usageCount is zero
        const fileId = idToBePulled[0];
        models[relatedDataType].findOne({ id: fileId })
          .lean()
          .exec()
          .then((fileObj) => {
            const { usageCount, uri } = fileObj;
            if (usageCount > 1) {
              updateObject = {
                $inc: {
                  usageCount: -1,
                },
              };
            } else {
              promiseArray.push(models[relatedDataType].findOneAndRemove({ id: fileId }).exec());
              promiseArray.push(deleteFromS3(uri));
            }
          });
      } else {
        // delete field
        updateObject = {
          $unset: {
            [relatedFieldName]: '',
          },
        };
      }
      // if the case is of file deletion then updateObject will be empty
      if (Object.keys(updateObject).length) {
        promiseArray.push(models[relatedDataType].updateMany(searchObj, updateObject));
      }
    }
  });

  return Promise.all(promiseArray);
};

export default removeConnectionWhenDisconnected;

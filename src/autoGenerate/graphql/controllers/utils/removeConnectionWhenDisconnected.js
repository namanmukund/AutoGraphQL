import models from '../../../models';

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
        updateObject = {
          $pull: {
            [relatedFieldName]: { typeId: targetUpdateId },
          },
        };
      } else if (relatedDataType === 'File') {
        updateObject = {
          $inc: {
            usageCount: -1,
          },
        };
      } else {
        updateObject = {
          $unset: {
            [relatedFieldName]: '',
          },
        };
      }
      promiseArray.push(models[relatedDataType].updateMany(searchObj, updateObject));
    }
  });

  return Promise.all(promiseArray);
};

export default removeConnectionWhenDisconnected;

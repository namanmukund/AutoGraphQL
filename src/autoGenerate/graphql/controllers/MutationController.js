import { pickBy } from 'lodash';
import MasterController from './MasterController';
import { DatabaseRecordNotFoundError, PermissionDeniedError } from '../../../../constants/errors';
import { defaultPermissionErrorMsg } from '../../../../constants';
import { getUpdatedRecordObject } from './utils/utils';
import { paginationKeys } from './QueryController/paginate';
import getQueryParams from './QueryController/filters';

const deleteQueriedResult = (Model, params, limitValue, skipValue) => Model.remove(params).limit(limitValue).skip(skipValue).exec();

const deleteQueriedResultFromLast = (Model, params, limitValue, skipValue) => Model.find(params).count().exec().then((result) => {
  const valueSkip = result - limitValue - skipValue > 0 ? result - limitValue - skipValue : 0;
  return Model.remove(params).limit(limitValue).skip(valueSkip).exec();
});

// Mutation controller
class MutationController extends MasterController {
  addDocument(input) {
    return this.validatePermissions({ input }, false)
      .then((isAllowedParam) => {
        const isAllowed = isAllowedParam;
        if (!isAllowed.status) {
          if (!isAllowed.data) {
            isAllowed.data = defaultPermissionErrorMsg;
          }
          throw new PermissionDeniedError({
            data: {
              message: isAllowed.data,
            },
          });
        }
        // to prevent creating fields with null/undefined/'' values
        const modifiedInput = pickBy(input, (v) => v !== null && v !== undefined && v !== '');
        const record = new this.Model(modifiedInput);
        return record.save();
      })
      .then((result) => result);
  }

  // accepts id of doc to update along with the fields that have to be modified
  updateDocument(
    id,
    input,
    relationFieldsArray = [],
    additionalRelationFieldsArray = [],
    arrayFieldsArray = [],
    historyObject = {},
    nestedDisconnectObjInfo = {},
  ) {
    return this.validatePermissions({
      id,
      input,
      relationFieldsArray,
      additionalRelationFieldsArray,
    }, false)
      .then((isAllowedParam) => {
        const isAllowed = isAllowedParam;
        if (!isAllowed.status) {
          if (!isAllowed.data) {
            isAllowed.data = defaultPermissionErrorMsg;
          }
          throw new PermissionDeniedError({
            data: {
              message: isAllowed.data,
            },
          });
        }
        return this.Model.findOne({ id }).exec();
      })
      .then((res) => {
        if (!res) {
          throw new DatabaseRecordNotFoundError();
        }
        let record = res;
        /* If reference fields in update doc, then add relation only if it doesnt
          already exist in the relation field and then
         replace the fields in record with the input fields
         */
        record = getUpdatedRecordObject(
          input,
          record,
          relationFieldsArray,
          additionalRelationFieldsArray,
          arrayFieldsArray,
          nestedDisconnectObjInfo,
        );
        const hookMetaData = {
          ...historyObject,
          authentication: this.authentication,
        };

        return record.save(hookMetaData);
      })
      .then((updated) => updated);
  }

  deleteDocumentWithAnyKey(param) {
    return this.validatePermissions({ param }, false)
      .then((isAllowedParam) => {
        const isAllowed = isAllowedParam;
        if (!isAllowed.status) {
          if (!isAllowed.data) {
            isAllowed.data = defaultPermissionErrorMsg;
          }
          throw new PermissionDeniedError({
            data: {
              message: isAllowed.data,
            },
          });
        }
        return this.Model.remove(param).exec();
      })
      .then((result) => result);
  }

  deleteDocument(id) {
    return this.validatePermissions({ id }, false)
      .then((isAllowedParam) => {
        const isAllowed = isAllowedParam;
        if (!isAllowed.status) {
          if (!isAllowed.data) {
            isAllowed.data = defaultPermissionErrorMsg;
          }
          throw new PermissionDeniedError({
            data: {
              message: isAllowed.data,
            },
          });
        }
        return this.Model.findOneAndRemove({ id }).exec();
      })
      .then((result) => result);
  }

  deleteMany(paramsForFetch) {
    let inputParams = { ...paramsForFetch };
    return this.validatePermissions(inputParams, false)
      .then((isAllowedParam) => {
        const isAllowed = isAllowedParam;
        if (!isAllowed.status) {
          if (!isAllowed.data) {
            isAllowed.data = defaultPermissionErrorMsg;
          }
          throw new PermissionDeniedError({
            data: {
              message: isAllowed.data,
            },
          });
        }
        if (isAllowed.status && isAllowed.data) {
          inputParams = isAllowed.data;
        }
        const allParams = paginationKeys(inputParams);
        const {
          lastValue, skipValue, afterId, beforeId,
        } = allParams;
        const params = allParams.inputParams;
        delete params.orderBy;
        if (afterId) { params.id = { $gt: `${afterId}` }; } else if (beforeId) { params.id = { $lt: `${beforeId}` }; }
        if (params.filter) {
          const queryParams = getQueryParams(params, this.modelName);
          return queryParams.then((query) => {
            const data = query;
            if (afterId) { data.id = { $gt: `${afterId}` }; } else if (beforeId) { data.id = { $lt: `${beforeId}` }; }
            if (lastValue) {
              return deleteQueriedResultFromLast(this.Model, data, lastValue, skipValue);
            }
            return deleteQueriedResult(this.Model, data, params.firstValue, skipValue);
          });
        }
        if (lastValue) {
          return deleteQueriedResultFromLast(this.Model, params, lastValue, skipValue);
        }
        return deleteQueriedResult(this.Model, params, params.firstValue, skipValue);
      })
      .then((result) => result);
  }

  // a generic update query for updating single/multiple docs, return update status
  /* send strict true if you want that your mongoose should strictly follow
  schema else false */
  update(searchObj, updateObj, updateMultiple = false, strict = true,
    historyObject = {}) {
    return this.validatePermissions({ searchObj, updateObj, updateMultiple }, false)
      .then((isAllowedParam) => {
        const isAllowed = isAllowedParam;
        if (!isAllowed.status) {
          if (!isAllowed.data) {
            isAllowed.data = defaultPermissionErrorMsg;
          }
          throw new PermissionDeniedError({
            data: {
              message: isAllowed.data,
            },
          });
        }
        const queryOptions = {
          multi: updateMultiple,
          strict,
          ...historyObject,
          authentication: this.authentication,
        };
        return this.Model.update(searchObj, updateObj, queryOptions);
      });
  }

  // updates one and return new updated doc
  updateOne(searchObj, updateObj) {
    return this.validatePermissions({ searchObj, updateObj }, false)
      .then((isAllowedParam) => {
        const isAllowed = isAllowedParam;
        if (!isAllowed.status) {
          if (!isAllowed.data) {
            isAllowed.data = defaultPermissionErrorMsg;
          }
          throw new PermissionDeniedError({
            data: {
              message: isAllowed.data,
            },
          });
        }
        return this.Model.findOneAndUpdate(searchObj, updateObj, { new: true }).exec();
      })
      .then((result) => result);
  }

  // finds or creates and returns the doc
  findOrCreate(id, input) {
    return this.validatePermissions({ id, input }, false)
      .then((isAllowedParam) => {
        const isAllowed = isAllowedParam;
        if (!isAllowed.status) {
          if (!isAllowed.data) {
            isAllowed.data = defaultPermissionErrorMsg;
          }
          throw new PermissionDeniedError({
            data: {
              message: isAllowed.data,
            },
          });
        }
        return this.Model.findOne({ id }).exec();
      })
      .then((res) => {
        if (res) {
          return res;
        }
        return this.addDocument(input);
      });
  }

  // finds and updates with new input or creates new
  findAndUpdateOrCreate(id, input) {
    return this.validatePermissions({ id, input }, false)
      .then((isAllowedParam) => {
        const isAllowed = isAllowedParam;
        if (!isAllowed.status) {
          if (!isAllowed.data) {
            isAllowed.data = defaultPermissionErrorMsg;
          }
          throw new PermissionDeniedError({
            data: {
              message: isAllowed.data,
            },
          });
        }
        return this.Model.findOne({ id }).exec();
      })
      .then((res) => {
        if (res) {
          // update and return updated doc
          return this.Model.findOneAndUpdate({ id }, input, { new: true });
        }
        return this.addDocument(input);
      });
  }
}

export default MutationController;

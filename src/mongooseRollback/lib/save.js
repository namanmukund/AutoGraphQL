/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
/* eslint-disable func-names */
import { QueryController } from '../../autoGenerate/graphql/controllers';
import { compareObjects } from '../../../utils';
import { isBackendApp } from '../../autoGenerate/graphql/validation';

function save(schema) {
  const { RollbackModel } = schema.statics;

  function storeOriginalModel(model = {}, metadata, cb) {
    const id = model._id;
    // find and update existing Document
    RollbackModel.find({ _id: id }).exec((err, hists) => {
      if (err) {
        cb(null);
        return;
      }
      const { category, subCategory } = metadata;
      let histModel;
      const originalModel = model.toObject();
      if (category) {
        originalModel.category = category;
      }
      if (subCategory) {
        originalModel.subCategory = subCategory;
      }
      // if history exists
      if (hists && hists.length) {
        delete originalModel.updatedAt;
        // append the original model to history
        histModel = hists[0];
        const totalSavedHistoryElements = histModel.data.length;
        const lastModelHistorySaved = { ...histModel.data[totalSavedHistoryElements - 1] };
        delete lastModelHistorySaved.updatedAt;
        // if original and last save hist is same, dont add original model in history
        if (compareObjects(lastModelHistorySaved, originalModel)) {
          cb(null);
          return;
        }
        histModel.currentVersion += 1;
        Object.assign(originalModel,
          {
            updatedAt: model.updatedAt,
            _version: histModel.currentVersion,
          });
        histModel.data.set(totalSavedHistoryElements, originalModel);
      } else {
        // if history for model not present
        // create new
        originalModel._version = 0;
        const histObj = {
          currentVersion: 0,
          _id: id,
          data: [originalModel],
        };
        histModel = new RollbackModel(histObj);
      }
      histModel.save((error, hist) => cb(error, hist));
    });
  }

  // First entry into history model
  function storeNewModel(model = {}, metadata, hookType, done) {
    const v = model._version;
    const id = model._id;
    const { category, subCategory } = metadata;
    // find and update existing Document
    RollbackModel.find({ _id: id }).exec((err, hists) => {
      if (err) {
        done(err);
        return;
      }

      if (!hists || !hists[0]) {
        return;
      }
      const histModel = hists[0];

      // update version now before push
      // update existing model
      histModel.currentVersion += 1;
      model._version = histModel.currentVersion;
      const historyModelToAppend = { ...model.toObject() };
      if (category) { historyModelToAppend.category = category; }
      if (subCategory) { historyModelToAppend.subCategory = subCategory; }
      histModel.data.set(histModel.data.length, historyModelToAppend);
      histModel.save((error) => {
        if (error) {
          // undo changes
          model._version = v;
          done(error);
        }
        // for post hook, save the record with updated version
        if (hookType === 'post') {
          model.save();
        }
        done();
      });
    });
  }

  function deleteModelHistory(historyId, done) {
    RollbackModel.remove({ _id: historyId }, (err) => {
      if (err) {
        done(err);
      }
      // if does not find id, will not err, count will be == 0
      done();
    });
  }

  schema.pre('save', function (next, metaData) {
    const { modelName } = this.constructor;
    const isTokenFromBackendApp = isBackendApp(metaData.authentication);
    if (!metaData.category || !isTokenFromBackendApp) {
      next();
      return;
    }
    const modelId = this.id;
    const queryControllerObject = new QueryController(modelName, { bypass: true });
    queryControllerObject.fetchById(modelId).then((originalModel) => {
      if (originalModel) {
        storeOriginalModel(originalModel, metaData, () => {
          storeNewModel(this, metaData, 'pre', next);
        });
      } else {
        next();
      }
    });
  });

  schema.pre('update', function (next) {
    const saveHistory = this.options.category;
    const isTokenFromBackendApp = isBackendApp(this.options.authentication);
    if (!saveHistory || !isTokenFromBackendApp) {
      next();
      return;
    }
    const modelQueryConditions = this._conditions;
    const modelName = this._collection.collectionName;
    const queryControllerObject = new QueryController(modelName, { bypass: true });
    queryControllerObject.fetchOne(modelQueryConditions).then((originalModel) => {
      if (originalModel) {
        storeOriginalModel(originalModel, this.options, () => {
          next();
        });
      } else {
        next();
      }
    });
  });

  schema.post('update', function (res, next) {
    const saveHistory = this.options.category;
    const isTokenFromBackendApp = isBackendApp(this.options.authentication);
    if (!saveHistory || !isTokenFromBackendApp) {
      next();
      return;
    }
    const modelQueryConditions = this._conditions;
    const modelName = this._collection.collectionName;
    const queryControllerObject = new QueryController(modelName, { bypass: true });
    queryControllerObject.fetchOne(modelQueryConditions).then((newModel) => {
      storeNewModel(newModel, this.options, 'post', next);
    });
  });
  // cascade on delete
  schema.pre('remove', true, function (next, done) {
    next();
    deleteModelHistory(this._id, done);
  });
  schema.pre('findOneAndRemove', true, function (next, done) {
    next();
    const modelQueryConditions = this._conditions;
    const modelName = this._collection.collectionName;
    const queryControllerObject = new QueryController(modelName, { bypass: true });
    queryControllerObject.fetchOne(modelQueryConditions).then((newModel) => {
      if (newModel) {
        deleteModelHistory(newModel._id, done);
      }
    });
  });
}

// TODO: versioning wont work on multi delete

module.exports = save;

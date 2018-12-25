/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */

function methods(schema) {
  const RollbackModel = schema.statics.RollbackModel;

  // Query hist model for cur version
  schema.methods.currentVersion = function (callback) {
    const id = this._id;

    RollbackModel.findOne(
      { _id: id },
      { currentVersion: 1, _id: 1 },
      callback,
    );
  };

  // Return the version in data array
  schema.methods.getVersion = function (version, callback) {
    const id = this._id;
    RollbackModel.findOne({ _id: id },
      { data: { $elemMatch: { _version: version } } },
      (err, hist) => {
        if (err) {
          callback(err, null);
          return;
        }

        err = new Error(`Model at version ${version} does not exist`);

        if (!hist) {
          if (version !== 0) {
            callback(err, null);
            return;
          }

          return;
        }

        const prevModel = hist.data[0];

        if (typeof prevModel === 'undefined') {
          callback(err, null);
          return;
        }

        callback(null, prevModel);
      },
    );
  };

  // Return data array in range supplied
  schema.methods.getHistory = function (min, max, callback) {
    const id = this._id;
    const skip = min || 0;

    RollbackModel.findOne({ _id: id }, { data: 1 },
      (err, hist) => {
        if (err) {
          callback(err, null);
          return;
        }

        // if history model is empty, we will update and return it;
        if (!hist) {
          // we know what to return, we can update model async
          if (skip > 0) {
            callback(err, []);
            return;
          }
          return;
        }

        const entries = hist.data.length;

        // if skip is greater then entries then
        if (entries === 0 || entries < skip) {
          callback(err, []);
          return;
        }

        // if max is out of bounds, reset it.
        if (max > entries) {
          max = entries;
        }

        // XXX: Cuttting based on array index NOT version
        // TODO: Convert version to array range based on specified max stored value
        callback(err, hist.data.slice(skip, max));
      },
    );
  };

  // Update state to new version with updates from previous version
  schema.methods.rollback = function (version, callback) {
    const id = this._id;
    const self = this;

    RollbackModel.findOne({ _id: id },
      { data: { $elemMatch: { _version: version } } },
      (error, hist) => {
        if (error) {
          callback(error, null);
          return;
        }

        // update each field in model with old_version
        const prevModel = hist.data[0];
        if (typeof prevModel === 'undefined') {
          const err = new Error(`Model at version ${version} does not exist`);
          callback(err, null);
          return;
        }

        Object.keys(prevModel).forEach((key) => {
          self[key] = prevModel[key];
        });

        // save changes and callback take care of rest
        self.save(callback);
      },
    );
  };

  // Revert state to previous update, remove new revisions
  schema.methods.revert = function (version, callback) {
    const id = this._id;
    const self = this;

    if (isNaN(version)) {
      callback(new Error('version must be a number'), null);
      return;
    }

    RollbackModel.findOne({ _id: id },
      { data: { $elemMatch: { _version: version } } },
      (error, hist) => {
        if (error) {
          callback(error, null);
          return;
        }

        // update each field in model with old_version
        const prevModel = hist.data[0];
        if (typeof prevModel === 'undefined') {
          const err = new Error(`Model at version ${version} does not exist`);
          callback(err, null);
          return;
        }

        // Revert changes to model at v = version
        Object.keys(prevModel).forEach((key) => {
          self[key] = prevModel[key];
        });

        // Decrement version number (changes haven't been recorded yet);
        self._version = version;

        // remove previous revisions
        schema.statics.RollbackModel.update({ _id: id },
          { currentVersion: version,
            $pull: { data: { _version: { $gte: version } } } },
          (err) => {
            if (err) {
              callback(err);
              return; // couldn't remove array stuff
            }

            // save changes and callback take care of rest
            self.save(callback);
          });
      },
    );
  };
}


module.exports = methods;

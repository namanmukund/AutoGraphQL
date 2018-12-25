const buildRollbackMethods = require('./lib/methods.js');
const buildSaveMethods = require('./lib/save.js');

function rollbackPlugin(modelSchema, options) {
  const schema = modelSchema;
  /* SCHEMA CHANGES */

  schema.add({ _version: {
    type: Number,
    default: 0,
  },
  });

  // assumes connection happens before plugin or something? not sure but yea..

  // add index on version field
  if (options && options.index) {
    schema.path('_version').index(options.index);
  }

  const Rollback = options.mongooseModel;

  schema.statics.RollbackModel = Rollback;

  /* STORAGE METHODS (happen transparently) */
  buildSaveMethods(schema, options);

  /* DOCUMENT METHODS (happen on instances of a model) */
  buildRollbackMethods(schema, options);
}


module.exports = rollbackPlugin;

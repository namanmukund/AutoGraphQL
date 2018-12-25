const mongoose = require('mongoose');

const Anything = mongoose.Schema.Types.Mixed;

const RollbackSchema = {
  data: {
    // XXX: Consider making this a sub document
    type: [Anything],
    required: true,
  },

  currentVersion: {
    type: Number,
    required: true,
    index: true,
  },

};

export default RollbackSchema;

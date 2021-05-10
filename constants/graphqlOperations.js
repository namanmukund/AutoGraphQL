const SINGULAR = 'singular';
const PLURAL = 'plural';
const META_QUERY = 'meta';

const ADD = 'add';
const UPDATE = 'update';
const UPDATE_MULTIPLE = 'updateMultiple';
const DELETE = 'delete';
const DELETE_MULTIPLE = 'deleteMultiple';

const READ = `["${SINGULAR}", "${PLURAL}", "${META_QUERY}"]`;
const WRITE = `["${ADD}", "${UPDATE}", "${UPDATE_MULTIPLE}", "${DELETE}", "${DELETE_MULTIPLE}"]`;
const EXCEPT_DELETE = `["${ADD}", "${UPDATE}", "${UPDATE_MULTIPLE}", "${SINGULAR}", "${PLURAL}", "${META_QUERY}"]`;

export {
  SINGULAR,
  PLURAL,
  META_QUERY,
  ADD,
  UPDATE,
  UPDATE_MULTIPLE,
  DELETE,
  DELETE_MULTIPLE,
  READ,
  WRITE,
  EXCEPT_DELETE,
};

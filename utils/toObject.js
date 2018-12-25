const toObject = (object) => {
  if (object && (typeof object.toObject === 'function')) {
    const objectData = object.toObject();
    return objectData;
  }
  return object;
};

export default toObject;

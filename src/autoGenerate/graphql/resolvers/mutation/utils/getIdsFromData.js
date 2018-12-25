const getIdsFromData = (responseData) => {
  const idList = responseData.map(singleData => `"${singleData.id}"`);
  return idList;
};
export { getIdsFromData };

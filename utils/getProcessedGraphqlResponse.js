const getProcessedGraphqlResponse = (response, modelName) => {
  if (response && response.data && response.data[modelName]) {
    return { result: response.data[modelName], status: 'success' };
  }
  return { result: response, status: 'error' };
};

export default getProcessedGraphqlResponse;

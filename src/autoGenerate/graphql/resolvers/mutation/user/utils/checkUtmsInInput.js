const checkUtmsInInput = (input = {}) => {
  const utmsArray = ['utmSource', 'utmCampaign', 'utmTerm', 'utmContent', 'utmMedium'];
  for (let i = 0; i < utmsArray.length; i += 1) {
    if (input && input[utmsArray[i]]) {
      return true;
    }
  }
  return false;
};

export default checkUtmsInInput;

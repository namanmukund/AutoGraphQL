const getCorrectCodingLanguageTitle = (codingLanguage) => {
  switch (codingLanguage) {
    case 'Cplusplus':
      return 'C++';
    case 'Csharp':
      return 'C#';
    default:
      return codingLanguage || '';
  }
};
const getMentorCodingLanguages = (codingLanguages) => {
  let codingLanguageStr = '';
  if (codingLanguages && codingLanguages.length) {
    codingLanguages.forEach((language, index) => {
      if (index < codingLanguages.length - 1) {
        codingLanguageStr += `${getCorrectCodingLanguageTitle(language.value)}, `;
      } else {
        codingLanguageStr += `${getCorrectCodingLanguageTitle(language.value)}`;
      }
    });
  }
  return codingLanguageStr;
};

export default getMentorCodingLanguages;

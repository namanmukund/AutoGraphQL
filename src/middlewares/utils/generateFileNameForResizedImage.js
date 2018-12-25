// this handles the case where there are multiple dots in the file name
const generateFileNameForResizedImage = (fileKind, fileName, key) => {
  const splitFileName = fileName.split('.');
  let newFileName = '';
  for (let i = 0; i < splitFileName.length - 1; i += 1) {
    if (i !== (splitFileName.length - 2)) {
      newFileName += `${splitFileName[i]}.`;
    } else {
      newFileName += `${splitFileName[i]}`;
    }
  }
  const newPath = `${`${fileKind}/${newFileName}`}_${key}.${splitFileName[splitFileName.length - 1]}`;
  return newPath;
};

export default generateFileNameForResizedImage;

const BASE_URL = process.env.FILE_BASE_URL;

const getFullFilePath = (file) => {
  if (file.includes(BASE_URL)) {
    return file;
  }
  /** Not appending Date here helps in caching of files */
  return `${BASE_URL}/${file}`;
};

export default getFullFilePath;

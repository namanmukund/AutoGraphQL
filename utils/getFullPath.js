const BASE_URL = 'https://tekie-tms-test.s3.amazonaws.com';

const getFullPath = (file) => {
  if (file.includes(BASE_URL)) {
    return file;
  }
  /** Not appending Date here helps in caching of files */
  return `${BASE_URL}/${file}`;
};

export default getFullPath;

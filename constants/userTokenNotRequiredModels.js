// Models that do not require an active user session for public access
const userTokenNotRequiredModels = [
  'File',
  'Post',
  'Comment',
  'Category',
  'Tag',
  'AppToken',
  'BlacklistedToken',
];

export default userTokenNotRequiredModels;

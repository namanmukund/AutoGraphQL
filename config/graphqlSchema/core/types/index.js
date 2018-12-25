import User from './user';
import File from './file';
import Collections from './collections';
import AppToken from './appToken';
import BlacklistedToken from './blacklistedToken';
import AppVersion from './appVersion';
import Library from './library';

export default [
  ...User,
  ...File,
  ...Collections,
  ...AppToken,
  ...BlacklistedToken,
  ...AppVersion,
  ...Library,
];

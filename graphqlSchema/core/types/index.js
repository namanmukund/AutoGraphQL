import User from './user';
import UserProfile from './userProfile';
import Post from './post';
import Comment from './comment';
import Category from './category';
import Tag from './tag';
import File from './file';
import AppToken from './appToken';
import BlacklistedToken from './blacklistedToken';
import Collections from './collections';

const types = [
  ...User,
  ...UserProfile,
  ...Post,
  ...Comment,
  ...Category,
  ...Tag,
  ...File,
  ...AppToken,
  ...BlacklistedToken,
  ...Collections,
];

export default types;

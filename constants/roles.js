const ADMIN = 'admin';
const EDITOR = 'editor';
const AUTHOR = 'author';
const USER = 'user';
const GUEST = 'guest';
const SERVICE = 'service';

const ALL_ROLES_ARRAY = [
  ADMIN,
  EDITOR,
  AUTHOR,
  USER,
  GUEST,
  SERVICE,
];

const ALL_ROLES = `[
  "${ADMIN}",
  "${EDITOR}",
  "${AUTHOR}",
  "${USER}",
  "${GUEST}",
  "${SERVICE}"
]`;

const NOT_ADMIN = `[
  "${EDITOR}",
  "${AUTHOR}",
  "${USER}",
  "${GUEST}",
  "${SERVICE}"
]`;

export {
  ADMIN,
  EDITOR,
  AUTHOR,
  USER,
  GUEST,
  SERVICE,
  ALL_ROLES,
  ALL_ROLES_ARRAY,
  NOT_ADMIN,
};

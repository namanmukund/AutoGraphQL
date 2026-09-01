import {
  ADMIN,
  EDITOR,
  AUTHOR,
  USER,
  GUEST,
  SERVICE,
} from './roles';

const userPermissionsDoc = {
  User: {
    collection: {
      rule: 'allow',
      crud: [ADMIN, SERVICE],
      read: [EDITOR, AUTHOR, USER, GUEST],
      exceptDelete: [USER, GUEST],
    },
    fields: {
      role: {
        rule: 'allow',
        crud: [ADMIN, SERVICE],
        read: [ADMIN, EDITOR, AUTHOR, USER, GUEST, SERVICE],
        exceptDelete: [USER, GUEST],
      },
    },
  },
  Post: {
    collection: {
      rule: 'allow',
      crud: [ADMIN, EDITOR, AUTHOR, SERVICE],
      read: [ADMIN, EDITOR, AUTHOR, USER, GUEST, SERVICE],
    },
  },
  Comment: {
    collection: {
      rule: 'allow',
      crud: [ADMIN, EDITOR, USER, SERVICE],
      read: [ADMIN, EDITOR, AUTHOR, USER, GUEST, SERVICE],
    },
  },
  Category: {
    collection: {
      rule: 'allow',
      crud: [ADMIN, EDITOR, SERVICE],
      read: [ADMIN, EDITOR, AUTHOR, USER, GUEST, SERVICE],
    },
  },
  Tag: {
    collection: {
      rule: 'allow',
      crud: [ADMIN, EDITOR, AUTHOR, SERVICE],
      read: [ADMIN, EDITOR, AUTHOR, USER, GUEST, SERVICE],
    },
  },
};

export default userPermissionsDoc;

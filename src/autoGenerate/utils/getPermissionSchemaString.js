import { get } from 'lodash';
import userPermissionsDoc from '../../../constants/userPermissionsDoc';
import { EXCEPT_DELETE, READ, WRITE } from '../../../constants/graphqlOperations';

const generatePermissionString = (permissionObj) => {
  let permissionString = '';
  const {
    rule, crud, read, write, exceptDelete,
  } = permissionObj;

  // rule is mandatory
  if (
    !rule
    || !['allow', 'deny'].includes(rule)
  ) {
    return '';
  }

  permissionString = `
      @userPermissions( permissions:[
`;
  let flag = false;

  if (crud && crud.length) {
    flag = true;
    permissionString += `{ operations: "*" userRole: ${JSON.stringify(crud)} appName: "*" },`;
  }

  if (read && read.length) {
    flag = true;
    permissionString += `{ operations:${READ} userRole: ${JSON.stringify(read)} appName: "*" }`;
  }

  if (write && write.length) {
    flag = true;
    permissionString += `{ operations: ${WRITE} userRole: ${JSON.stringify(write)} appName: "*" }`;
  }

  if (exceptDelete && exceptDelete.length) {
    flag = true;
    permissionString += `{ operations: ${EXCEPT_DELETE} userRole: ${JSON.stringify(exceptDelete)} appName: "*" }`;
  }
  if (flag) {
    permissionString += `] rule: ${rule})`;
    return permissionString;
  }
  return '';
};

const getPermissionSchemaString = (typeName, fieldName) => {
  // if typeName does not exist in permissionSchema
  if (!typeName || !get(userPermissionsDoc, typeName)) {
    return '';
  }
  // if schema is generated for a field of a collection
  if (fieldName) {
    const fieldNameObj = get(userPermissionsDoc, `${typeName}.fields.${fieldName}`);
    if (!fieldNameObj) {
      return '';
    }
    return generatePermissionString(fieldNameObj);
  }
  // else it's on collection level
  const collectionNameObj = get(userPermissionsDoc, `${typeName}.collection`);
  if (!collectionNameObj) {
    return '';
  }
  return generatePermissionString(collectionNameObj);
};

export default getPermissionSchemaString;

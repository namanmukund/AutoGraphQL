// converts a object to input string for use in mutations
import { trimEnd } from 'lodash';

const getGraphqlStringFromObject = (object) => {
  let grapqhlString = '{';
  if (object && Object.keys(object) && Object.keys(object).length) {
    Object.keys(object).forEach((key) => {
      // enum case not handled
      switch (typeof object[key]) {
        case 'boolean':
        case 'int':
          grapqhlString += `${key}: ${object[key]},`;
          break;
        default:
          grapqhlString += `${key}: "${object[key]}",`;
      }
    });
  }
  grapqhlString = trimEnd(grapqhlString, ',');
  grapqhlString += '}';
  return grapqhlString;
};

export default getGraphqlStringFromObject;

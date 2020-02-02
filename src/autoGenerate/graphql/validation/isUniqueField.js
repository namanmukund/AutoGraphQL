import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';

import { OrderAlreadyExistsError } from '../../../../constants/errors';


const topicQuery = (topicId, collection, parent) => `{
${parent}(filter:{
    ${collection}_some:{
      id: "${topicId}"
    }
  }){
    id
    order
  }
}

`;


const chapterQuery = (topicId, collection, parent) => `{
  ${parent}(filter:{
      id_in: ${topicId}
  }){
    id
    ${collection}{
      id
      order
    }
  }
}
`;


const genericQuery = (topicId, collection, parent) => `{
${parent}(filter:{
    ${collection}_some:{
      id: "${topicId}"
    }
  }){
    id
    ${collection}{
      id
      order
    }
  }
}

`;


const convertToMap = (src) => {
  return Object.assign({}, ...src.map((s) => ({ [s.id]: s.order })));
}
const isUniqueField = async (params, collection, type, parent) => {
  console.log(collection, type,
    parent);

  switch (type) {
    case 'update':
      const queryRes = await callGraphqlApi(genericQuery(params.id, collection, parent));
      const info = get(queryRes, `data.${parent}[0].${collection}`);
      const infoMap = convertToMap(info)
      const updateOrder = get(params, 'input.order');
      if (Object.prototype.hasOwnProperty.call(infoMap, params.id)) {
        if (infoMap[params.id] !== updateOrder) {
          if (Object.values(infoMap).indexOf(updateOrder) > -1) {
            throw new OrderAlreadyExistsError();
          }
        }
      }


    case 'addChapter':
      const chapterQueryRes = await callGraphqlApi(chapterQuery(JSON.stringify(params.coursesConnectIds), collection, parent), {});
      const chapterInfo = get(chapterQueryRes, `data.${parent}`);
      chapterInfo.forEach((data) => {
        const topicInfoMap = convertToMap(data.chapters)
        const order = get(params, 'input.order');
        if (Object.values(topicInfoMap).indexOf(order) > -1) {
          throw new OrderAlreadyExistsError();
        }
      });

    case 'addTopic':
      const topicQueryRes = await callGraphqlApi(topicQuery(params.chapterConnectId, collection, parent));
      const topicInfo = get(topicQueryRes, `data.${parent}`);
      const topicInfoMap = convertToMap(topicInfo)
      const order = get(params, 'input.order');
      if (Object.values(topicInfoMap).indexOf(order) > -1) {
        throw new OrderAlreadyExistsError();
      }
  }
};
export default isUniqueField;

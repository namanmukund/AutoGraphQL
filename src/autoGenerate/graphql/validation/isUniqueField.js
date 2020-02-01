import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';

import { OrderAlreadyExistsError } from '../../../../constants/errors';


const topicQ = (topicId, collection, parent) => `{
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


const chapterQ = (topicId, collection, parent) => `{
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


const chapterQuery = (topicId, collection, parent) => `{
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
      const chapterQueryRes = await callGraphqlApi(chapterQuery(params.id, collection, parent));
      const chapterInfo = get(chapterQueryRes, `data.${parent}[0].${collection}`);
      const infoMap = convertToMap(chapterInfo)
      const updateOrder = get(params, 'input.order');
      if (Object.prototype.hasOwnProperty.call(infoMap, params.id)) {
        if (infoMap[params.id] !== updateOrder) {
          if (Object.values(infoMap).indexOf(updateOrder) > -1) {
            throw new OrderAlreadyExistsError();
          }
        }
      }


    case 'addChapter':
      const topicQueryRes = await callGraphqlApi(chapterQ(JSON.stringify(params.coursesConnectIds), collection, parent), {});
      const topicInfo = get(topicQueryRes, `data.${parent}`);
      topicInfo.forEach((data) => {
        const topicInfoMap = convertToMap(data.chapters)
        const order = get(params, 'input.order');
        if (Object.values(topicInfoMap).indexOf(order) > -1) {
          throw new OrderAlreadyExistsError();
        }
      });

    case 'addTopic':
      const topicQueryRes1 = await callGraphqlApi(topicQ(params.chapterConnectId, collection, parent));
      const topicInfo1 = get(topicQueryRes1, `data.${parent}`);
      const topicInfoMap = convertToMap(topicInfo1)
      const order = get(params, 'input.order');
      if (Object.values(topicInfoMap).indexOf(order) > -1) {
        throw new OrderAlreadyExistsError();
      }
  }
};
export default isUniqueField;

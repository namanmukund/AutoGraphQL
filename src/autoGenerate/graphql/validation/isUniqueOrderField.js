import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';

import { OrderAlreadyExistsError } from '../../../../constants/errors';


const topicQuery = (parentId, parent, collections) => `{
${collections}(filter:{
    ${parent}_some:{
      id: "${parentId}"
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


const chapterTopicQuery = (topicId, collection, parent) => `{
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


const convertToMap = (src) => Object.assign({}, ...src.map((s) => ({ [s.id]: s.order })));
const isUniqueOrderField = async (params, mutationOrQueryName) => {
  switch (mutationOrQueryName) {
    case 'updateTopic':
    case 'updateChapter': {
      let query = '';
      let queryName = '';
      let parentName = '';
      if (mutationOrQueryName === 'updateTopic') {
        query = chapterTopicQuery(params.id, 'topics', 'chapters');
        queryName = 'topics';
        parentName = 'chapters';
      } else {
        query = chapterTopicQuery(params.id, 'chapters', 'courses');
        queryName = 'chapters';
        parentName = 'courses';
      }
      const queryRes = await callGraphqlApi(query);
      const info = get(queryRes, `data.${parentName}[0].${queryName}`);
      const infoMap = convertToMap(info);
      const updateOrder = get(params, 'input.order');
      if (Object.prototype.hasOwnProperty.call(infoMap, params.id)) {
        if (infoMap[params.id] !== updateOrder) {
          if (Object.values(infoMap)
            .indexOf(updateOrder) > -1) {
            throw new OrderAlreadyExistsError();
          }
        }
      }
      break;
    }
    case 'addChapter': {
      const query = chapterQuery(JSON.stringify(params.coursesConnectIds), 'chapters', 'courses');
      const chapterQueryRes = await callGraphqlApi(query, {});
      const chapterInfo = get(chapterQueryRes, 'data.courses');
      chapterInfo.forEach((data) => {
        const topicInfoMap = convertToMap(data.chapters);
        const order = get(params, 'input.order');
        if (Object.values(topicInfoMap)
          .indexOf(order) > -1) {
          throw new OrderAlreadyExistsError();
        }
      });
      break;
    }

    case 'addTopic': {
      const query = topicQuery(params.chapterConnectId, 'chapter', 'topics');
      const topicQueryRes = await callGraphqlApi(query);
      const topicInfo = get(topicQueryRes, 'data.topics');
      const topicInfoMap = convertToMap(topicInfo);
      const order = get(params, 'input.order');
      if (Object.values(topicInfoMap)
        .indexOf(order) > -1) {
        throw new OrderAlreadyExistsError();
      }
      break;
    }
    default:
  }
};
export default isUniqueOrderField;

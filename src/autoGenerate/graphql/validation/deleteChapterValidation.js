import callGraphqlApi from '../../../api/callGraphqlApi';
import { DeleteChapter } from '../../../../constants/errors';
import { get } from 'lodash';


const deleteChapterValidation = async (params) => {
    // const queryTypeName = lowerCase(typeName);
    const { id } = params;
    const query = `
  query{
    chapter(id:"${id}"){
      topicsMeta(filter:{
        status:published
      }){
        count
      }
    }
  }
  `;


    const response = await callGraphqlApi(query);

    const publishedTopicsCount = get(response, 'data.chapter.topicsMeta.count', 0);
    if (publishedTopicsCount && publishedTopicsCount > 0) {
        throw new DeleteChapter();
    }
};

export default deleteChapterValidation;
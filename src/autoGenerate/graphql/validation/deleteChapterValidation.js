import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import { DeleteChapterError } from '../../../../constants/errors';


const deleteChapterValidation = async (params) => {
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
    throw new DeleteChapterError();
  }
};

export default deleteChapterValidation;

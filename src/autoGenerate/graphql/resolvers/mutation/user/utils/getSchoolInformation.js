import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';

const getSchoolInformation = async (schoolName) => {
  const query = `
query{
  schools(filter:{
    name:"${schoolName}"
  }){
    id
  }
}
`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.schools[0].id');
};

export default getSchoolInformation;

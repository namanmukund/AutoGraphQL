/*eslint-disable*/
import { MENTOR, MENTEE } from "../../../../constants/roles";
import { get } from 'lodash'
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';

const addMentorProfileQuery = (userConnectId) => `
mutation {
    addMentorProfile(userConnectId:"${userConnectId}", input: {}) {
        id
    }
}
`;

const addUserWithMenteeRoleForMentor = (name) => `
mutation {
    addUser(input: {
      name: "${name}",
      role: ${MENTEE}   
    }) {
      id
    }
  }
`

const addStudentProfileQuery = (userConnectId, mentorConnectId) => `
mutation {
    addStudentProfile(userConnectId: "${userConnectId}", mentorConnectId: "${mentorConnectId}", input:{
      grade: 6
    }) {
      id
    }
  }
`

const addUserPostHookMethod = async (input, params) => {
    if (get(params, 'input.role') === MENTOR) {
        console.log("mentorid", get(input, 'id'))
        const res = await callLocalGraphqlApi(addMentorProfileQuery(get(input, 'id')))
        console.log("response afrter mentor profile query", res);
      console.log(get(res.data, 'addMentorProfile.id'));
        if(get(res.data, 'addMentorProfile.id')) {
        const mentorConnectId = get(res.data, 'addMentorProfile.id')
        console.log("mentorConnectId", mentorConnectId)
        const email = get(input, 'email');
        const name = get(input, 'name')
        const userData = await callLocalGraphqlApi(addUserWithMenteeRoleForMentor(name))
        console.log("userdata", userData)
        const userConnectId = get(userData.data, 'addUser.id');
        console.log("userconnectid", userConnectId)
        if(get(userData.data, 'addUser.id')) {
        const fresp = await callLocalGraphqlApi(addStudentProfileQuery(userConnectId, mentorConnectId))
        console.log("final", fresp)
        }
        }
    }
};
  
  export default addUserPostHookMethod;
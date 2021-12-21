/* eslint-disable no-lonely-if */
/* eslint-disable no-new-wrappers */
/* eslint-disable dot-notation */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { log } from '../../../../../../utils';

const userData = require('./json/addOrUpdateUsersInBulk.json');

const userQuery = (phoneNumber) => `
{
  users(filter:{
    phone_number_subDoc: "${phoneNumber}"
  }){
    id
  }
}
`;

const parentChildSignupQuery = (user) => `
mutation {
  parentChildSignUp(input: {
    parentName: "${user['Parent Name']}",
    childName: "${user['Student Name']}",
    parentEmail: "${user['Email ID']}",
    parentPhone: {
      countryCode: "+91",
      number: "${user['Contact number']}"
    },
    ${user.Standard ? `grade: Grade${user.Standard},` : ''}
    hasLaptopOrDesktop: true,
    timezone: "Asia/Kolkata",
    utmSource: "${user['UTM_Source']}",
    utmCampaign: "${user['UTM_Campaign']}",
    utmTerm: "${user['UTM term']}"
  }) {
    id
    name
    token
    role
    email
    source
    country
    phone {
      countryCode
      number
    }
    campaign {
      type
    }
    createdAt
    children {
      id
      name
      token
      role
    }
    parentProfile {
      children {
        id
        grade
        section
        profileAvatarCode
        batch {
          id
          b2b2ctimeTable {
            slot0
            slot1
            slot2
            slot3
            slot4
            slot5
            slot6
            slot7
            slot8
            slot9
            slot10
            slot11
            slot12
            slot13
            slot14
            slot15
            slot16
            slot17
            slot18
            slot19
            slot20
            slot21
            slot22
            slot23
          }
        }
        user {
          id
          timezone
        }
        batch {
          type
        }
        school {
          id
          name
          whiteLabel
          logo {
            uri
          }
        }
      }
    }
  }
}
`;

const addMenteeSessionQuery = (userId, bookingDate, slot) => `
mutation {
  addMenteeSession(input: {
    bookingDate: "${bookingDate}",
    slot${slot}: true,
    country: india
  },
    userConnectId: "${userId}",
    topicConnectId: "cjx2czgja00001h2xt7fjlh04",
    courseConnectId: "cjs8skrd200041huzz78kncz5") {
    id
    topic {
      id
    }
  }
}
`;

const getSlotNumber = (time) => {
  const firstHalf = time.split(' ')[0];
  const secondHalf = time.split(' ')[1];
  const timePortion = Math.round(firstHalf.split(':')[0]);
  let number = timePortion;
  if (secondHalf.toUpperCase() === 'AM') {
    // handle for 12 AM case
    if (timePortion === 12) {
      number = 0;
    }
  } else {
    // handle for 12 PM case
    if (timePortion !== 12) {
      number += 12;
    }
  }
  return number;
};

const addOrUpdateUsersInBulk = async () => {
  // check for users based on phone number
  if (userData && userData.length) {
    for (const user of userData) {
      const userRes = get(await callLocalGraphqlApi(userQuery(user['Contact number'])), 'data.users', []);
      try {
        if (userRes.length === 0) {
          // here we proceed to call the parent child signup query with the necessary parameters
          const parentChildSignupRes = get(await callLocalGraphqlApi(parentChildSignupQuery(user)), 'data.parentChildSignUp', {});
          const childUserId = get(parentChildSignupRes, 'children[0].id', '');
          if (childUserId) {
            log(`****** childUserId ${childUserId}`);
            const scheduledDate = user['Schedule Date'];
            const finalDate = `${scheduledDate.split('/')[1]}/${scheduledDate.split('/')[0]}/${scheduledDate.split('/')[2]}`;
            log(`****** final date ${finalDate}`);
            const bookingDate = new Date(finalDate);
            const slot = getSlotNumber(user['Time']);
            log(`****** booking date ${bookingDate}`);
            log(`****** slot number ${slot}`);
            // prepare the date and slot for calling addMenteeSession query
            const addMenteeSessionQueryRes = get(await callLocalGraphqlApi(addMenteeSessionQuery(childUserId, bookingDate, slot)), 'data.addMenteeSession', {});
            log(`****** added menteeSession id ${addMenteeSessionQueryRes.id}`);
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log(err);
      }
    }
  }
};

export default addOrUpdateUsersInBulk;

/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { get } from 'lodash';
import { MutationController } from '../../../controllers';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const getIdArrForQuery = (idArr) => {
  let arr = '';
  if (idArr) {
    idArr.forEach((id) => {
      arr += `"${id}",`;
    });
    if (arr.length && arr[arr.length - 1] === ',') {
      arr.substring(0, arr.length - 1);
    }
  }
  return arr;
};

const getBatchSessionsQuery = (batchId) => `
    query{
    batchSessions(filter:{
      and:[
        {
          batch_some:{
            id: "${batchId}"
          }
        },
        {
          sessionStatus_in: [started, allotted]
        }
      ]
    }){
      id
      bookingDate
      attendance {
        status
      }
      topic{
        order
      }
    }
  }
  `;

const getStudentProfilesFromSchool = (schoolId, grade, section) => `
    query{
        studentProfiles(filter:{
            and: [
                { school_some:{ id:"${schoolId}" } }
                { grade: ${grade} }
                { section: ${section} }
            ]
        }) {
            id
            grade
            section
            batch {
                id
            }
        }
    }
  `;

const updateBatchSessionQuery = (
  batchSessionId, pushManyQuery,
) => `
  mutation{
    updateBatchSession(id:"${batchSessionId}",  input:{
      ${pushManyQuery}
    }){
      id
    }
  }
  `;

const updateBatch = (
  batchId, studentProfileIds,
) => `
  mutation{
    updateBatch(id:"${batchId}",
    studentsConnectIds: [${getIdArrForQuery(studentProfileIds)}]
    input: {}){
      id
    }
  }
  `;

const updateStudentProfile = (studentProfileId, batchId) => `
    mutation {
        updateStudentProfile(id:"${studentProfileId}", batchConnectId:"${batchId}") {
            id
        }
    }
  `;

const RemappingBatchStudentInSchool = async (root, params, context) => {
  const schoolId = 'cl3dbjvg300000u5fd3ig03rs';
  const requestArray = [
    {
      id: 'cl3sf4mc200270u26ais68mpr',
      grade: 'Grade4',
      section: 'A',
    },
    {
      id: 'cl3sf6e72002b0u263n8hek5c',
      grade: 'Grade4',
      section: 'B',
    },
    {
      id: 'cl3sf9r5g002d0u262di74nva',
      grade: 'Grade4',
      section: 'C',
    },
    {
      id: 'cl3sfbb4n03kj0u245fuw53dm',
      grade: 'Grade4',
      section: 'D',
    },
    {
      id: 'cl3sfj2gz03kp0u241387fgu2',
      grade: 'Grade5',
      section: 'A',
    },
    {
      id: 'cl3sfkkea03kr0u2472qq1xvi',
      grade: 'Grade5',
      section: 'B',
    },
    {
      id: 'cl3sfmcqi03kt0u24avk45b9d',
      grade: 'Grade5',
      section: 'C',
    },
    {
      id: 'cl3sft4qq03l20u242j9raeme',
      grade: 'Grade6',
      section: 'A',
    },
    {
      id: 'cl3sftswt002j0u26a44182f4',
      grade: 'Grade6',
      section: 'B',
    },
    {
      id: 'cl3sg0qfi03l80u2455cw3vie',
      grade: 'Grade7',
      section: 'A',
    },
    {
      id: 'cl3sg18h2002n0u260dsne9to',
      grade: 'Grade7',
      section: 'B',
    },
    {
      id: 'cl3sg2hhn03la0u2474fx4mre',
      grade: 'Grade8',
      section: 'A',
    },
    {
      id: 'cl3sg2x4h03lc0u24b6s0hiiy',
      grade: 'Grade8',
      section: 'B',
    },
    {
      id: 'cl3sia6ki00000u36c8qng7s4',
      grade: 'Grade1',
      section: 'A',
    },
    {
      id: 'cl3siai9j00020u36cbeu0p0z',
      grade: 'Grade1',
      section: 'B',
    },
    {
      id: 'cl3siaus900040u36c6wt1n6e',
      grade: 'Grade1',
      section: 'C',
    },
    {
      id: 'cl3sib8in00060u369k0w5b1e',
      grade: 'Grade1',
      section: 'D',
    },
    {
      id: 'cl3siblh7044z0u2400he50eh',
      grade: 'Grade1',
      section: 'E',
    },
    {
      id: 'cl3sics1i00080u365ez1dqwx',
      grade: 'Grade2',
      section: 'A',
    },
    {
      id: 'cl3sid32104510u24h3u28t36',
      grade: 'Grade2',
      section: 'B',
    },
    {
      id: 'cl3siddss000b0u36dsnr4lxl',
      grade: 'Grade2',
      section: 'C',
    },
    {
      id: 'cl3sidq6t04530u24a8715etg',
      grade: 'Grade2',
      section: 'D',
    },
    {
      id: 'cl3sie33w000e0u36ay0kc0ls',
      grade: 'Grade2',
      section: 'E',
    },
    {
      id: 'cl3sietg0000g0u363yx41poa',
      grade: 'Grade3',
      section: 'A',
    },
    {
      id: 'cl3sif5ih04550u241oyy6s2r',
      grade: 'Grade3',
      section: 'B',
    },
    {
      id: 'cl3sifhwo04570u2494zeec5z',
      grade: 'Grade3',
      section: 'C',
    },
    {
      id: 'cl3sifukm000i0u369oc49lb8',
      grade: 'Grade3',
      section: 'D',
    },
    {
      id: 'cl3sig6xz04590u2446g8dkpj',
      grade: 'Grade3',
      section: 'E',
    },
  ];

  for (const batch of requestArray) {
    const batchId = batch.id;
    const grade = batch.grade;
    const section = batch.section;
    console.log('~~~~~~~~');
    console.log(`Processing for ${grade} - ${section}`);
    console.log('~~~~~~~~');
    // Empty Batch Session Attendance Array
    const notCompletedBatchSessionsResult = await callLocalGraphqlApi(getBatchSessionsQuery(batchId));
    const notCompletedBatchSessions = get(notCompletedBatchSessionsResult, 'data.batchSessions', []);
    console.log('Total Session Length:', notCompletedBatchSessions.length);
    for (const batchSession of notCompletedBatchSessions) {
      if (!get(batchSession, 'attendance', []).length) console.log('~~~~~~~~> Skipping SessionId:', batchSession.id);
      if (batchSession && get(batchSession, 'attendance', []).length) {
        console.log('Removing attendance for SessionId:', batchSession.id);
        await callLocalGraphqlApi(updateBatchSessionQuery(
          batchSession.id,
          'attendance:{ popAll: true }',
        ), context);
      }
    }

    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ NEXT STAGE');
    const studentProfilesRes = await callLocalGraphqlApi(getStudentProfilesFromSchool(schoolId, grade, section));
    const studentProfiles = get(studentProfilesRes, 'data.studentProfiles', []);
    if (studentProfiles.length) {
      console.log('Removing Students from Batch:', batchId);
      const controller = new MutationController('Batch', { bypass: true });
      await controller.update({ id: batchId }, { students: [] }, true);

      console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ NEXT STAGE');
      const studentProfileIds = studentProfiles.map((profile) => profile.id);
      console.log('Adding Student Profile ids to Batch:', studentProfileIds);
      await callLocalGraphqlApi(updateBatch(batchId, studentProfileIds));

      console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ NEXT STAGE');
      const updatedStudentProfilesRes = await callLocalGraphqlApi(getStudentProfilesFromSchool(schoolId, grade, section));
      const updatedStudentProfiles = get(updatedStudentProfilesRes, 'data.studentProfiles', []);
      for (const profile of updatedStudentProfiles) {
        if (profile && profile.id && get(profile, 'batch.id') !== batchId) {
          console.log('Mapping Batch to Student Profile:', profile.id);
          await callLocalGraphqlApi(updateStudentProfile(profile.id, batchId));
        } else {
          console.log(`~~~~~~> Batch ${batchId} Already Mapped to StudentProfile: ${profile.id}`);
        }
      }
    }
  }
};

export default RemappingBatchStudentInSchool;

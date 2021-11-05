import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const MentorDemandSlot = `
  type MentorDemandSlot @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  )
  ${getPermissionSchemaString('MentorAvailabilitySlot')}
  {
    date: Date!
    verticals: [SingleSlotVertical]!
    sessionType: SessionType @defaultValue(value: "trial")
    slots: [MentorAvailabilitySlot] @relation(name: "MentorDemandSlotMentorAvailabilitySlot")
    broadCastedMentors: [MentorProfile] @relation(name:"MentorDemandSlotAllMentor", direction: "OneWay")
  }
`;

export default [MentorDemandSlot];

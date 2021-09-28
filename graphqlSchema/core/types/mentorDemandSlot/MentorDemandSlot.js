import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import {
  UMS_HEAD, NOT_UMS_HEAD,
} from '../../../../constants/roles';

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
  @userPermissions(
    permissions:[
      { userRole: ${UMS_HEAD} appName: "*" operations: "*" },
      { userRole: ${NOT_UMS_HEAD} appName: "*" operations: ${READ} },
      ], 
    rule: allow
  ) 
  {
    date: Date!
    verticals: [SingleSlotVertical]!
    sessionType: SessionType @defaultValue(value: "trial")
    slots: [MentorDemandSingleSlot] @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    broadCastedMentors: [MentorProfile] @relation(name:"MentorDemandSlotAllMentor", direction: "OneWay")
  }
`;

export default [MentorDemandSlot];

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
    vertical: Vertical!
    slot0: MentorDemandSingleSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    slot1: MentorDemandSingleSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    slot2: MentorDemandSingleSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    slot3: MentorDemandSingleSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    slot4: MentorDemandSingleSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    slot5: MentorDemandSingleSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    slot6: MentorDemandSingleSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    slot7: MentorDemandSingleSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    slot8: MentorDemandSingleSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    slot9: MentorDemandSingleSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    slot10: MentorDemandSingleSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    slot11: MentorDemandSingleSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    slot12: MentorDemandSingleSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    slot13: MentorDemandSingleSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    slot14: MentorDemandSingleSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    slot15: MentorDemandSingleSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    slot16: MentorDemandSingleSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    slot17: MentorDemandSingleSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    slot18: MentorDemandSingleSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    slot19: MentorDemandSingleSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    slot20: MentorDemandSingleSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    slot21: MentorDemandSingleSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    slot22: MentorDemandSingleSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    slot23: MentorDemandSingleSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    mentors: [MentorProfile] @relation(name:"MentorDemandSlotAllMentor", direction: "OneWay")
  }
`;

export default [MentorDemandSlot];

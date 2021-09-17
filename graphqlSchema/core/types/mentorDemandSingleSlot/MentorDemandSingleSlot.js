import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import {
  UMS_HEAD, NOT_UMS_HEAD,
} from '../../../../constants/roles';

const MentorDemandSingleSlot = `
  type MentorDemandSingleSlot @model
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
    mentorDemandSlot: MentorDemandSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    slotName: Slot
    paySlab: MentorSupplyPaySlab @relation(name: "MentorDemandSlotPaySlab", direction: "OneWay")
    countries: [Country]
    timezone: [String]
    count: Int
    schools: [School] @relation(name:"MentorDemandSingleSlotSchool", direction: "OneWay")
    campaigns: [Campaign] @relation(name:"MentorDemandSingleSlotCampaign", direction: "OneWay")
    broadCastedMentors: [MentorProfile] @relation(name:"MentorDemandSingleSlotMentor", direction: "OneWay")
    menteeSessions: [MenteeSession] @relation(name:"MentorDemandSingleSlotMenteeSession")
    batchSessions: [BatchSession] @relation(name:"MentorDemandSingleSlotBatchSession")
    mentorSessions: [MentorSession] @relation(name:"MentorDemandSingleSlotMentorSession")
    isBroadCasted: Boolean
  }
`;

export default [MentorDemandSingleSlot];

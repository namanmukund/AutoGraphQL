import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import {
  UMS_HEAD, NOT_UMS_HEAD,
} from '../../../../constants/roles';

const SingleSlotCountry = `
 type SingleSlotCountry {
   value: Country
 }
`;

const SingleSlotVertical = `
 type SingleSlotVertical {
   value: Vertical
 }
`;

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
    verticals: [SingleSlotVertical]!
    mentorDemandSlot: MentorDemandSlot @relation(name: "MentorDemandSlotMentorDemandSingleSlot")
    slotName: Slot
    paySlab: MentorSupplyPaySlab @relation(name: "MentorDemandSingleSlotPaySlab", direction: "OneWay")
    countries: [SingleSlotCountry]
    timezone: [String]
    count: Int
    sessionType: SessionType @defaultValue(value: "trial")
    schools: [School] @relation(name:"MentorDemandSingleSlotSchool", direction: "OneWay")
    campaigns: [Campaign] @relation(name:"MentorDemandSingleSlotCampaign", direction: "OneWay")
    broadCastedMentors: [MentorProfile] @relation(name:"MentorDemandSingleSlotMentor", direction: "OneWay")
    menteeSessions: [MenteeSession] @relation(name:"MentorDemandSingleSlotMenteeSession")
    batchSessions: [BatchSession] @relation(name:"MentorDemandSingleSlotBatchSession")
    mentorSessions: [MentorSession] @relation(name:"MentorDemandSingleSlotMentorSession")
    mentorMenteeSessions: [MentorMenteeSession] @relation(name:"MentorDemandSingleSlotMentorMenteeSession")
    isBroadCasted: Boolean @defaultValue(value: "false")
  }
`;

export default [MentorDemandSingleSlot, SingleSlotCountry, SingleSlotVertical];

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

const MentorAvailabilitySlot = `
  type MentorAvailabilitySlot @model
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
    mentorDemandSlot: MentorDemandSlot @relation(name: "MentorDemandSlotMentorAvailabilitySlot")
    slotName: Slot
    paySlab: MentorSupplyPaySlab @relation(name: "MentorAvailabilitySlotPaySlab", direction: "OneWay")
    countries: [SingleSlotCountry]
    timezone: [String]
    count: Int
    sessionType: SessionType @defaultValue(value: "trial")
    schools: [School] @relation(name:"MentorAvailabilitySlotSchool", direction: "OneWay")
    campaigns: [Campaign] @relation(name:"MentorAvailabilitySlotCampaign", direction: "OneWay")
    broadCastedMentors: [MentorProfile] @relation(name:"MentorAvailabilitySlotMentor", direction: "OneWay")
    menteeSessions: [MenteeSession] @relation(name:"MentorAvailabilitySlotMenteeSession")
    batchSessions: [BatchSession] @relation(name:"MentorAvailabilitySlotBatchSession")
    mentorSessions: [MentorSession] @relation(name:"MentorAvailabilitySlotMentorSession")
    mentorMenteeSessions: [MentorMenteeSession] @relation(name:"MentorAvailabilitySlotMentorMenteeSession")
    isBroadCasted: Boolean @defaultValue(value: "false")
    openedBy: MentorProfile @relation(name: "MentorAvailabilitySlotOpenedBy", direction: "OneWay")
    acceptedMentorSlotRequest: [AcceptedSlotRequestByMentorLog] @relation(name:"MentorAvailabilitySlotAcceptedSlotRequestByMentorLog")
  }
`;

export default [MentorAvailabilitySlot, SingleSlotCountry, SingleSlotVertical];

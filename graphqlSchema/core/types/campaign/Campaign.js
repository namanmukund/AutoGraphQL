import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import getSlotTimeFields from '../../functions/getSlotTimeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const BatchRules = `
  type BatchRules {
   batchSize: Int
   batchCreationBasis: BatchCreationBasis
 }`;

const CampaignTimeTableRules = `
  type CampaignTimeTableRules {
   bookingDate: Date
   ${slotTimeFields}
   allottedMentor: User @relation(name: "CampaignUser", direction: "OneWay")
 }`;

const Campaign = `
  type Campaign @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  )
  {
    course: Course! @relation(name: "CampaignCourse", direction: "OneWay")
    title: String! @trim
    code: String @unique @trim
    description: String
    type: CampaignType!
    batchRules: BatchRules
    timeTableRules: [CampaignTimeTableRules]
    batches: [Batch] @relation(name: "CampaignBatch")
    classes: [SchoolClass] @relation(name: "CampaignSchoolClass", direction: "OneWay")
    batchCreationStatus: BatchCreationStatus @defaultValue(value: "todo")
    poster: File @relation(name: "posterCampaign", direction: "OneWay")
    school: School @relation(name: "CampaignSchool", direction: "OneWay")
  }
`;

export default [Campaign, BatchRules, CampaignTimeTableRules];

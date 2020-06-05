import getSlotTimeFields from '../../functions/getSlotTimeFields';
import { NOT_UMS_HEAD_AND_MENTOR, UMS_HEAD_AND_MENTOR } from '../../../../constants/roles';
import { READ } from '../../../../constants/graphqlOperations';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const MentorSession = `
  type MentorSession @model 
  @userPermissions(
  permissions:[
    { userRole: ${UMS_HEAD_AND_MENTOR} appName: "*" operations: "*" },
    { userRole: ${NOT_UMS_HEAD_AND_MENTOR} appName: "*" operations: ${READ} }
    ], 
  rule: allow
  ) 
  {
    user: User! @relation(name: "MentorSessionUser", direction: "OneWay")
    course: Course! @relation(name: "MentorSessionCourse", direction: "OneWay")
    availabilityDate: Date!
    ${slotTimeFields}
}`;

export default [MentorSession];

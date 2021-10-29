import { TBA, TMS } from '../../../../constants';
import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const SessionBooked = `
  type SessionBooked {
    registered: Int
    booked: Int
    demoCompleted: Int
    converted: Int
    phoneVerified: Int
    bookedBySelf: Int
    bookedByAgent: Int
  }
`;

const SessionGradeReport = `
  type SessionGradeReport @model 
  ${getPermissionSchemaString('SessionReport')}
  @appPermissions(
    permissions: [
    { appName: "${TBA}" operations: "*" },
    { appName: "${TMS}" operations: "*" }
  ],
    rule: allow
  )
  {
    grade1: SessionBooked
    grade2: SessionBooked
    grade3: SessionBooked
    grade4: SessionBooked
    grade5: SessionBooked
    grade5: SessionBooked
    grade6: SessionBooked
    grade7: SessionBooked
    grade8: SessionBooked
    grade9: SessionBooked
    grade10: SessionBooked
    grade11: SessionBooked
    grade12: SessionBooked
    country: Country @defaultValue(value: "india")
    date: Date
    vertical: Vertical
  }
`;

export default [SessionGradeReport, SessionBooked];

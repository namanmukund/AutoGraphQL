import { TBA, TMS } from '../../../../constants';
import { READ } from '../../../../constants/graphqlOperations';
import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const SessionBookedToday = `
  type SessionBookedToday {
    registered: Int
    booked: Int
    demoCompleted: Int
    converted: Int
    phoneVerified: Int
    bookedBySelf: Int
    bookedByAgent: Int
  }
`;

const SessionReport = `
  type SessionReport @model 
  ${getPermissionSchemaString('SessionReport')}
  @appPermissions(
    permissions: [
    { appName: "${TBA}" operations: "*" },
    { appName: "${TMS}" operations: ${READ} }
  ],
    rule: allow
  )
  {
    registeredSameDay: SessionBookedToday
    registeredOneDayBefore: SessionBookedToday
    registeredTwoDaysBefore: SessionBookedToday
    registeredThreeDaysBefore: SessionBookedToday
    totalBooked: Int
    totalDemoCompleted: Int
    totalConvertedUsers: Int
    country: Country @defaultValue(value: "india")
    date: Date
  }
`;

export default [SessionReport, SessionBookedToday];

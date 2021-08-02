import { TBA, TMS } from '../../../../constants';
import { READ } from '../../../../constants/graphqlOperations';
import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const SessionBookedToday = `
  type SessionBookedToday {
    registered: Int
    bookedToday: Int
    demoCompletedToday: Int
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
    registeredToday: SessionBookedToday
    registeredOneDayBefore: SessionBookedToday
    registeredTwoDaysBefore: SessionBookedToday
    registeredThreeDaysBefore: SessionBookedToday
    totalBookedToday: Int
    totalDemoCompleteToday: Int
    totalConvertedUsersToday: Int
    country: Country @defaultValue(value: "india")
    date: Date
  }
`;

export default [SessionReport, SessionBookedToday];

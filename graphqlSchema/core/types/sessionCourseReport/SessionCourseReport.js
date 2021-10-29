import { TBA, TMS } from '../../../../constants';
import { READ } from '../../../../constants/graphqlOperations';
import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const SessionCourseReport = `
  type SessionCourseReport @model 
  ${getPermissionSchemaString('SessionReport')}
  @appPermissions(
    permissions: [
    { appName: "${TBA}" operations: "*" },
    { appName: "${TMS}" operations: ${READ} }
  ],
    rule: allow
  )
  {
    registered: Int
    booked: Int
    demoCompleted: Int
    converted: Int
    phoneVerified: Int
    bookedBySelf: Int
    bookedByAgent: Int
    course: Course @relation(name: "SessionCourseReportCourse", direction: "OneWay")
    country: Country @defaultValue(value: "india")
    date: Date
    vertical: Vertical
  }
`;

export default [SessionCourseReport];

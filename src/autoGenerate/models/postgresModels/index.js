import UserSessionDumpModel from './userSessionDump.pg.model';
import UserSessionReportModel from './userSessionReport.pg.model';
import UserLevelSessionReportModel from './userLevelSessionReports.pg.model';
import differentVersionsOfModel from '../../utils/differentVersionsOfModal';

const models = [
  ...differentVersionsOfModel(UserSessionDumpModel),
  ...differentVersionsOfModel(UserSessionReportModel),
  ...differentVersionsOfModel(UserLevelSessionReportModel),
];

export default models;

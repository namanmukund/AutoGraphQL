import { frontEndApps } from '../../../../../../constants';

export const getAppNameEnum = () => {
  let appNameEnum = 'enum AppName {';
  frontEndApps.forEach((app) => {
    appNameEnum += `${app} `;
  });
  appNameEnum += '}';
  return appNameEnum;
};

const AppName = getAppNameEnum();

export default AppName;

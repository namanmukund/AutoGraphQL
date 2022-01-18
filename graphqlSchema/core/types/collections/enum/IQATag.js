import { iqaTags } from '../../../../../constants';

export const getIQATags = () => {
  let iqaTagEnum = 'enum IQATag {';
  iqaTags.forEach((role) => {
    iqaTagEnum += `${role} `;
  });
  iqaTagEnum += '}';
  return iqaTagEnum;
};

const IQATag = getIQATags();

export default IQATag;

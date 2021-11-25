import { get } from 'lodash';
import moment from 'moment';
import { log } from '../../../../../utils';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import sendWhatsAppTemplateMessage from '../../../utils/sendWhatsAppTemplateMessage';

const generateCertificate = async (id, regenerateCertificate, eventId, date) => {
  const query = `
    mutation{
      generateCertificate(input:{
        userId:"${id}"
        regenerateCertificate:${regenerateCertificate ? 'true' : 'false'}
        isEventCertificate: false
        eventId:"${eventId}"
        ${date ? `date: "${date}"` : ''}
      })
      {
        id
        assetUrl
        tekieUrl
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.generateCertificate', {});
};

const sendDemoCompletionCertificate = async (userId) => {
  // TODO : edit all these values
  const eventId = 'ckwakpd7k0000erin7yizcfi1';
  const certificateDetails = await generateCertificate(userId, false, eventId);
  const certificateLink = `${process.env.TEKIE_WEB_URL}/${get(certificateDetails, 'tekieUrl')}`;
  log(`##### Demo Completion Certificate Link - ${certificateLink}`);
  const parameters = [
    { name: 'parent_name', value: 'Gokul Parent' },
    { name: 'student_name', value: 'Gokul Child' },
    { name: 'w_date', value: moment('2021-11-14T18:30:00.000Z').format('dddd, Do MMMM') },
    { name: 'w_time', value: '11am' },
    { name: 'school_name', value: certificateLink },
  ];
  const phone = '919972181832';
  const bookTemplate = 'demo_booking_confirmation';
  sendWhatsAppTemplateMessage(phone, bookTemplate, phone, parameters);
  return true;
};

export default sendDemoCompletionCertificate;

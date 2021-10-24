/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable no-confusing-arrow */
import { PDFDocument, rgb } from 'pdf-lib';
import * as fs from 'fs';
import fontkit from '@pdf-lib/fontkit';
import { get } from 'lodash';
import mkdirp from 'mkdirp';
import { NUNITO_BOLD_FONT_URL } from '../../../../../../constants';
import { uploadToS3, getSignedS3Uri } from '../../../../../middlewares/utils/uploadToS3';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import getFormatedDate from '../../../../../../utils/getFormatedDate';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError } from '../../../../../../constants/errors';

const fetchUser = (number) => `
{
  users(filter: {
    and: [
      {studentProfile_some:
        {parents_some:
          {user_some: {
            phone_number_subDoc: "${number}"
          }}}}
    ]
  }){
    id
    name
  }
}
`;

const fetchEventCertificate = (number) => `
{
  eventCertificates(filter: {
    and: [
      {user_some:
      {studentProfile_some:
        {parents_some:
          {user_some: {
            phone_number_subDoc: "${number}"
          }}}}}
    ]
  }){
    id
    user{
      id
      name
    }
  }
}
`;

const addEventCertificate = (userId, signedUrl) => `
  mutation {
    addEventCertificate(userConnectId:"${userId}",
      input: {
        signedUrl: "${signedUrl}"
      }){
        id
        signedUrl
      }
  }
`;

const updateEventCertificate = (eventCertificateId, url) => `
 mutation{
  updateEventCertificate(id:"${eventCertificateId}",input:{
    signedUrl:"${url}"
  }){
    id
    signedUrl
  }
}
`;

const capitalize = (str, lower = false) => (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, (match) => match.toUpperCase());

const slugifyID = (ID) => ID ? ID.toString().trim().toUpperCase().replace(/\w{5}(?=.)/g, '$&-') : '';

const generateCertificateMutationResolver = async (
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  context,
) => {
  validateAuthentication(context);

  const { input } = params;

  const { phoneNumber } = input;

  const userRes = await callLocalGraphqlApi(fetchUser(phoneNumber));
  const users = get(userRes, 'data.users');

  if (users && users.length) {
    const date = new Date();
    const userName = get(users, '[0].name', '');
    const userId = get(users, '[0].id');
    const formattedDate = getFormatedDate(date);

    const url = 'https://tekie-backend.s3.amazonaws.com/python/course/radiostreetCertificate.pdf';
    const existingPdfBytes = await fetch(url).then((res) => res.buffer());

    // Load a PDFDocument from the existing PDF bytes
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);

    // Get the first page of the document
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // // Embed the Helvetica font
    const NunitoBoldfontBytes = await fetch(NUNITO_BOLD_FONT_URL).then((res) => res.buffer());

    const NunitoBoldFont = await pdfDoc.embedFont(NunitoBoldfontBytes);

    // Draw a string of text diagonally across the first page
    firstPage.drawText(`${capitalize(userName)}`, {
      x: 330,
      y: 506,
      size: 29,
      font: NunitoBoldFont,
      color: rgb(0, 0.678, 0.902),
    });

    firstPage.drawText(`${formattedDate}.`, {
      x: 385,
      y: 394,
      size: 18,
      font: NunitoBoldFont,
      color: rgb(0.3137, 0.31, 0.31),
    });

    /** PDF Meta Details */
    pdfDoc.setAuthor('Tekie');
    pdfDoc.setCreator('Kiwhode Learning Pvt Ltd');
    pdfDoc.setSubject('Radio Street Certificate');
    pdfDoc.setTitle('Radio Street Certificate');
    pdfDoc.setProducer('Tekie.in');

    const pdfBytes = await pdfDoc.save();
    const path = '/tmp/radiostreet/certificate-pdf.pdf';
    mkdirp.sync('/tmp/radiostreet');
    fs.writeFileSync(path, pdfBytes);
    const fileContent = fs.readFileSync(path);
    let fetchedUrl = '';
    if (fileContent) {
      const key = `python/event-certificate/radiostreet/${phoneNumber}-certificate.pdf`;
      await uploadToS3(key, fileContent);
      const fetchedUrlStr = await getSignedS3Uri(key);
      fetchedUrl = fetchedUrlStr.substring(0, fetchedUrlStr.indexOf('?'));
    }
    let eventCertificateCreated = null;
    if (fetchedUrl) {
      const eventCertificatesRes = await callLocalGraphqlApi(fetchEventCertificate(phoneNumber));
      const eventCertificates = get(eventCertificatesRes, 'data.eventCertificates');
      if (eventCertificates && eventCertificates.length) {
        const eventCertificateId = get(eventCertificates, '[0].id');
        const eventCertificateCreatedRes = await callLocalGraphqlApi(updateEventCertificate(eventCertificateId, fetchedUrl));
        eventCertificateCreated = get(eventCertificateCreatedRes, 'data.updateEventCertificate');
      } else {
        const eventCertificateCreatedRes = await callLocalGraphqlApi(addEventCertificate(userId, fetchedUrl));
        eventCertificateCreated = get(eventCertificateCreatedRes, 'data.addEventCertificate');
      }
    }
    const tekieUrl = `https://www.tekie.in/event-certificate/${slugifyID(get(eventCertificateCreated, 'id'))}`;
    return {
      ...eventCertificateCreated,
      tekieUrl,
    };
  }
  // if no such user found with given phone number
  throw new DatabaseRecordNotFoundError();
};

export default generateCertificateMutationResolver;

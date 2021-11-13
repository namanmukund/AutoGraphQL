/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable no-confusing-arrow */

import { PDFDocument, rgb } from 'pdf-lib';
import * as fs from 'fs';
import fontkit from '@pdf-lib/fontkit';
import mkdirp from 'mkdirp';
import { NUNITO_BOLD_FONT_URL } from '../../../../../../../constants';
import { uploadToS3 } from '../../../../../../middlewares/utils/uploadToS3';

const capitalize = (str, lower = false) => (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, (match) => match.toUpperCase());

const slugifyID = (ID) => ID ? ID.toString().trim().toUpperCase().replace(/\w{5}(?=.)/g, '$&-') : '';

const getCanvaEventCertificateUrl = async (userId, userName, formattedDate) => {
  const url = `${process.env.FILE_BASE_URL}/python/course/canvaEventCertificate.pdf`;
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
    x: 305,
    y: 502,
    size: 29,
    font: NunitoBoldFont,
    color: rgb(0, 0.678, 0.902),
  });

  firstPage.drawText(`${formattedDate}.`, {
    x: 278,
    y: 391,
    size: 18,
    font: NunitoBoldFont,
    color: rgb(0.3137, 0.31, 0.31),
  });

  /** PDF Meta Details */
  pdfDoc.setAuthor('Tekie');
  pdfDoc.setCreator('Kiwhode Learning Pvt Ltd');
  pdfDoc.setSubject('Tekie\'s Canva Masterclass Certificate');
  pdfDoc.setTitle('Tekie\'s Canva Masterclass Certificate');
  pdfDoc.setProducer('Tekie.in');

  const pdfBytes = await pdfDoc.save();
  const path = '/tmp/canvaevent/certificate-pdf.pdf';
  mkdirp.sync('/tmp/canvaevent');
  fs.writeFileSync(path, pdfBytes);
  const fileContent = fs.readFileSync(path);
  let fetchedUrl = '';
  if (fileContent) {
    const key = `event-certificate/canvaevent/${slugifyID(userId)}-certificate.pdf`;
    await uploadToS3(key, fileContent);
    fetchedUrl = key;
  }
  return fetchedUrl;
};

export default getCanvaEventCertificateUrl;

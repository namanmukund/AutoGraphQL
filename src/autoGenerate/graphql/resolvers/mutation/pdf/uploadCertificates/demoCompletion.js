/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable no-confusing-arrow */

import { PDFDocument, rgb } from 'pdf-lib';
import * as fs from 'fs';
import fontkit from '@pdf-lib/fontkit';
import mkdirp from 'mkdirp';
import { GILROY_EXTRA_BOLD_FONT_URL } from '../../../../../../../constants';
import { uploadToS3 } from '../../../../../../middlewares/utils/uploadToS3';

const slugifyID = (ID) => ID ? ID.toString().trim().toUpperCase().replace(/\w{5}(?=.)/g, '$&-') : '';

const getDemoCompletionCertificateUrl = async (userId, userName) => {
  const url = `${process.env.FILE_BASE_URL}/python/course/demoCompletionCertificate.pdf`;
  const existingPdfBytes = await fetch(url).then((res) => res.buffer());
  // Load a PDFDocument from the existing PDF bytes
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  pdfDoc.registerFontkit(fontkit);

  // Get the first page of the document
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  // // Embed the Helvetica font
  const GilroyExtraBoldfontBytes = await fetch(GILROY_EXTRA_BOLD_FONT_URL).then((res) => res.buffer());

  const GilroyExtraBoldFont = await pdfDoc.embedFont(GilroyExtraBoldfontBytes);

  // Draw a string of text diagonally across the first page
  firstPage.drawText(`${userName.toUpperCase()}`, {
    x: 75,
    y: 675,
    size: 60,
    font: GilroyExtraBoldFont,
    color: rgb(0, 0.678, 0.902),
  });

  /** PDF Meta Details */
  pdfDoc.setAuthor('Tekie');
  pdfDoc.setCreator('Kiwhode Learning Pvt Ltd');
  pdfDoc.setSubject('Tekie\'s Demo Completion Certificate');
  pdfDoc.setTitle('Tekie\'s Demo Completion Certificate');
  pdfDoc.setProducer('Tekie.in');

  const pdfBytes = await pdfDoc.save();
  const path = '/tmp/democompletion/certificate-pdf.pdf';
  mkdirp.sync('/tmp/democompletion');
  fs.writeFileSync(path, pdfBytes);
  const fileContent = fs.readFileSync(path);
  let fetchedUrl = '';
  if (fileContent) {
    const key = `event-certificate/democompletion/${slugifyID(userId)}-certificate.pdf`;
    await uploadToS3(key, fileContent);
    fetchedUrl = key;
  }
  return fetchedUrl;
};

export default getDemoCompletionCertificateUrl;

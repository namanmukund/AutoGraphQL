/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable no-confusing-arrow */

import { PDFDocument, rgb } from 'pdf-lib';
import * as fs from 'fs';
import fontkit from '@pdf-lib/fontkit';
import mkdirp from 'mkdirp';
import { get } from 'lodash';
import { GILROY_EXTRA_BOLD_FONT_URL, NUNITO_BOLD_FONT_URL } from '../../../../../../../constants';
import { uploadToS3 } from '../../../../../../middlewares/utils/uploadToS3';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';
import getStringWidth from '../utils/getStringWidthForEmbeddedFont';

const capitalize = (str, lower = false) => (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, (match) => match.toUpperCase());

const slugifyID = (ID) => ID ? ID.toString().trim().toUpperCase().replace(/\w{5}(?=.)/g, '$&-') : '';

const round5 = (x) => Math.round(x / 5) * 5;

const getDialUrl = (score) => `${process.env.FILE_BASE_URL}/python/course/iqaScores/score${round5(score)}.png`;

const getMentorRatingStars = (rating) => `${process.env.FILE_BASE_URL}/python/course/mentorRatings/${rating}star.png`;

const iqaReportQuery = (id) => `{
iqaReports(filter: {
  and: [
    {
      user_some: {
        id: "${id}"
      }
    }
  ]
} ){
    id
    iqaRank
    iqaScore
    globalRank
    maximumScore
    user{
      id
      name
      studentProfile{
        parents{
          user{
            name
          }
        }
      }
    }
  }
}`;

const getPostDemoSalesReportUrl = async (userId) => {
  const iqaReports = get(await callLocalGraphqlApi(iqaReportQuery(userId)), 'data.iqaReports', []);
  let url = '';
  let existingPdfBytes = null;
  let pdfDoc = null;
  if (iqaReports && iqaReports.length) {
    url = `${process.env.FILE_BASE_URL}/python/course/postDemoPostTest.pdf`;
    existingPdfBytes = await fetch(url).then((res) => res.buffer());
    // Load a PDFDocument from the existing PDF bytes
    pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);
    // Get the first page of the document
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const secondPage = pages[1];
    const thirdPage = pages[3];
    const { width } = firstPage.getSize();
    // // Embed the Helvetica font
    const GilroyExtraBoldfontBytes = await fetch(GILROY_EXTRA_BOLD_FONT_URL).then((res) => res.buffer());
    const GilroyExtraBoldFont = await pdfDoc.embedFont(GilroyExtraBoldfontBytes);
    const NunitoBoldfontBytes = await fetch(NUNITO_BOLD_FONT_URL).then((res) => res.buffer());
    const NunitoBoldFont = await pdfDoc.embedFont(NunitoBoldfontBytes);

    firstPage.drawText(`${'Parent Name'}`, {
      x: 100,
      y: 675,
      size: 15,
      font: NunitoBoldFont,
      color: rgb(0, 0.29, 0.678),
    });

    firstPage.drawText(`${'Student Name'}`, {
      x: 150,
      y: 625,
      size: 15,
      font: NunitoBoldFont,
      color: rgb(0, 0.29, 0.678),
    });
  } else {
    url = `${process.env.FILE_BASE_URL}/python/course/postDemoPreTest.pdf`;
    existingPdfBytes = await fetch(url).then((res) => res.buffer());
    // Load a PDFDocument from the existing PDF bytes
    pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);
    // Get the first page of the document
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width } = firstPage.getSize();
    // // Embed the Helvetica font
    const GilroyExtraBoldfontBytes = await fetch(GILROY_EXTRA_BOLD_FONT_URL).then((res) => res.buffer());
    const GilroyExtraBoldFont = await pdfDoc.embedFont(GilroyExtraBoldfontBytes);
    const NunitoBoldfontBytes = await fetch(NUNITO_BOLD_FONT_URL).then((res) => res.buffer());
    const NunitoBoldFont = await pdfDoc.embedFont(NunitoBoldfontBytes);
  }
  /** PDF Meta Details */
  pdfDoc.setAuthor('Tekie');
  pdfDoc.setCreator('Kiwhode Learning Pvt Ltd');
  pdfDoc.setSubject('Tekie\'s Demo Report');
  pdfDoc.setTitle('Tekie\'s Demo Report');
  pdfDoc.setProducer('Tekie.in');

  const pdfBytes = await pdfDoc.save();
  const path = '/tmp/postdemo/certificate-pdf.pdf';
  mkdirp.sync('/tmp/postdemo');
  fs.writeFileSync(path, pdfBytes);
  const fileContent = fs.readFileSync(path);
  let fetchedUrl = '';
  if (fileContent) {
    const key = `event-certificate/postdemo/${slugifyID(userId)}-certificate.pdf`;
    await uploadToS3(key, fileContent);
    fetchedUrl = key;
  }
  return fetchedUrl;
};

export default getPostDemoSalesReportUrl;

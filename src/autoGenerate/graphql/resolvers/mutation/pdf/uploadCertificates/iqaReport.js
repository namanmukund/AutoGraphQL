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

const getIqaReportSnapshotUrl = async (userId, userName) => {
  const iqaReports = get(await callLocalGraphqlApi(iqaReportQuery(userId)), 'data.iqaReports', []);
  console.log(iqaReports);
  const url = `${process.env.FILE_BASE_URL}/python/course/iqaReportSnapshotCompressed.pdf`;
  const existingPdfBytes = await fetch(url).then((res) => res.buffer());
  // Load a PDFDocument from the existing PDF bytes
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
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

  const dialImageBytes = await fetch(getDialUrl(get(iqaReports, '[0].iqaScoree', 70))).then((res) => res.buffer());

  const dialImage = await pdfDoc.embedPng(dialImageBytes);
  const dialDims = dialImage.scale(1);

  const mentorRatingStarBytes = await fetch(getMentorRatingStars(5)).then((res) => res.buffer());

  const mentorRatingStarImage = await pdfDoc.embedPng(mentorRatingStarBytes);
  const mentorRatingStarDim = mentorRatingStarImage.scale(1);

  firstPage.drawText(`${capitalize(get(iqaReports, '[0].user.name', ''))}'s IQA Report`, {
    x: (width - getStringWidth(`${capitalize(get(iqaReports, '[0].user.name', ''))}'s IQA Report`)) / 2,
    y: 1122,
    size: 24,
    font: NunitoBoldFont,
    color: rgb(0, 0.29, 0.678),
  });

  firstPage.drawText(`Dear ${capitalize('Gokul Madhusudhan')},`, {
    x: ((width - getStringWidth(`Dear ${capitalize('Gokul Madhusudhan')},`)) / 2) + 15,
    y: 1240,
    size: 16,
    font: NunitoBoldFont,
    color: rgb(0, 0, 0),
  });

  firstPage.drawText(`${get(iqaReports, '[0].iqaScore', 70)}`, {
    x: 170,
    y: 940,
    size: 50,
    font: GilroyExtraBoldFont,
    color: rgb(0, 0.29, 0.678),
  });

  firstPage.drawText(`/${get(iqaReports, '[0].maximumScore', 100)}`, {
    x: 170,
    y: 910,
    size: 20,
    font: GilroyExtraBoldFont,
    color: rgb(0.522, 0.518, 0.518),
  });

  firstPage.drawText(`${get(iqaReports, '[0].iqaRank', 70)}`, {
    x: 415,
    y: 997,
    size: 20,
    font: NunitoBoldFont,
    color: rgb(0.314, 0.310, 0.310),
  });

  firstPage.drawText(`${get(iqaReports, '[0].globalRank', 70)}`, {
    x: 415,
    y: 909,
    size: 20,
    font: NunitoBoldFont,
    color: rgb(0.314, 0.310, 0.310),
  });

  // dial image
  firstPage.drawImage(dialImage, {
    x: 87,
    y: 862,
    width: dialDims.width,
    height: dialDims.height,
  });

  firstPage.drawText(`${get(iqaReports, '[0].user.name', '').split(' ')[0].toUpperCase()}`, {
    x: 115,
    y: 790,
    size: 12,
    font: NunitoBoldFont,
    color: rgb(0.314, 0.310, 0.310),
  });

  firstPage.drawText(`${get(iqaReports, '[0].user.name', '').split(' ')[0].toUpperCase()}`, {
    x: 225,
    y: 790,
    size: 12,
    font: NunitoBoldFont,
    color: rgb(0.314, 0.310, 0.310),
  });

  firstPage.drawText(`${get(iqaReports, '[0].user.name', '').split(' ')[0].toUpperCase()}`, {
    x: 315,
    y: 790,
    size: 12,
    font: NunitoBoldFont,
    color: rgb(0.314, 0.310, 0.310),
  });

  // experience in coding
  firstPage.drawText(`${'3.5+ Years'}`, {
    x: 317,
    y: 660,
    size: 14,
    font: NunitoBoldFont,
    color: rgb(0, 0.29, 0.678),
  });

  // most common review
  firstPage.drawText(`${'Friendly & Dedicated'}`, {
    x: 317,
    y: 607,
    size: 14,
    font: NunitoBoldFont,
    color: rgb(0, 0.29, 0.678),
  });

  // Languages
  firstPage.drawText(`${'Java, Python'}`, {
    x: 317,
    y: 554,
    size: 14,
    font: NunitoBoldFont,
    color: rgb(0, 0.29, 0.678),
  });

  // languages familiar with
  firstPage.drawText(`${capitalize('Gokul Madhusudhan')}`, {
    x: ((width - getStringWidth(`${capitalize('Gokul Madhusudhan')}`)) / 4) + 40,
    y: 557,
    size: 14,
    font: NunitoBoldFont,
    color: rgb(0, 0.29, 0.678),
  });

  // mentor rating stars
  firstPage.drawImage(mentorRatingStarImage, {
    x: 155,
    y: 526,
    width: mentorRatingStarDim.width,
    height: mentorRatingStarDim.height,
  });

  // mentor circle
  firstPage.drawCircle({
    x: 200,
    y: 620,
    size: 40,
    color: rgb(0.969, 0.729, 0.290),
    opacity: 1,
  });

  /** PDF Meta Details */
  pdfDoc.setAuthor('Tekie');
  pdfDoc.setCreator('Kiwhode Learning Pvt Ltd');
  pdfDoc.setSubject('Tekie\'s IQA Report');
  pdfDoc.setTitle('Tekie\'s IQA Report');
  pdfDoc.setProducer('Tekie.in');

  const pdfBytes = await pdfDoc.save();
  const path = '/tmp/iqareport/certificate-pdf.pdf';
  mkdirp.sync('/tmp/iqareport');
  fs.writeFileSync(path, pdfBytes);
  const fileContent = fs.readFileSync(path);
  let fetchedUrl = '';
  if (fileContent) {
    const key = `event-certificate/iqareport/${slugifyID(userId)}-certificate.pdf`;
    await uploadToS3(key, fileContent);
    fetchedUrl = key;
  }
  return fetchedUrl;
};

export default getIqaReportSnapshotUrl;
